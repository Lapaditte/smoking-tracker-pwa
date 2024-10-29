import { openDB, addEntry, getAllEntries, clearAllEntries } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. First declare all variables
    let historicalData = [];
    let cigaretteCount = {
        daily: 0,
        weekly: 0,
        monthly: 0
    };
    let selectedPrice = 10;
    let lastCigaretteTime = null;
    let currentView = 'weekly';
    let currentPeriodIndex = 0;
    let currentTriggerView = 'weekly';

    // 2. Get DOM elements
    const cigaretteCountElements = {
        daily: document.getElementById('cigarette-count-daily'),
        weekly: document.getElementById('cigarette-count-weekly'),
        monthly: document.getElementById('cigarette-count-monthly')
    };
    const logCigaretteButton = document.getElementById('log-cigarette');
    const triggerOptions = document.querySelectorAll('.trigger-option');
    const priceOptions = document.querySelectorAll('.price-option');
    const customPriceInput = document.getElementById('custom-price');
    const costDisplayElements = {
        daily: document.getElementById('daily-cost'),
        weekly: document.getElementById('weekly-cost'),
        monthly: document.getElementById('monthly-cost'),
        yearly: document.getElementById('yearly-cost')
    };
    const smokeFreeTimeElement = document.getElementById('smoke-free-time');
    const healthImprovementsElement = document.getElementById('health-improvements');

    const mainTab = document.getElementById('main-tab');
    const historyTab = document.getElementById('history-tab');
    const mainContent = document.getElementById('main-content');
    const historyContent = document.getElementById('history-content');

    const historicalDataTab = document.getElementById('historical-data-tab');
    const trendsTab = document.getElementById('trends-tab');
    const triggerTrendsTab = document.getElementById('trigger-trends-tab');
    const historicalDataSection = document.getElementById('historical-data');
    const trendsSection = document.getElementById('trends');
    const triggerTrendsSection = document.getElementById('trigger-trends');

    const viewOptions = document.querySelectorAll('.view-option');
    const triggerViewOptions = document.querySelectorAll('.trigger-view-option');
    const prevPeriodButton = document.getElementById('prev-period');
    const nextPeriodButton = document.getElementById('next-period');
    const currentPeriodElement =   document.getElementById('current-period');

    const weeklyAverageElement = document.getElementById('weekly-average');
    const monthlyAverageElement = document.getElementById('monthly-average');
    const comparisonElement = document.getElementById('comparison');
    const longestStreakElement = document.getElementById('longest-streak');
    const previousStreakElement = document.getElementById('previous-streak');

    const customDateRange = document.getElementById('custom-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyCustomRangeButton = document.getElementById('apply-custom-range');

    const TRIGGER_COLORS = {
        'Stress': 'rgba(255, 99, 132, 0.6)',    // Red
        'Social': 'rgba(54, 162, 235, 0.6)',    // Blue
        'Boredom': 'rgba(255, 206, 86, 0.6)',   // Yellow
        'Habit': 'rgba(75, 192, 192, 0.6)',     // Green
        'After food': 'rgba(153, 102, 255, 0.6)', // Purple
        'With Coffee': 'rgba(255, 159, 64, 0.6)', // Orange
        'During work breaks': 'rgba(199, 199, 199, 0.6)', // Gray
        'Anxiety': 'rgba(83, 102, 255, 0.6)',    // Indigo
        'After exercise': 'rgba(255, 99, 255, 0.6)', // Pink
        'Other': 'rgba(159, 159, 159, 0.6)'      // Dark Gray
    };

    // 3. Define all functions
    function updateCigaretteCount() {
        cigaretteCountElements.daily.textContent = `${cigaretteCount.daily} cigarette${cigaretteCount.daily !== 1 ? 's' : ''} today`;
        cigaretteCountElements.weekly.textContent = `${cigaretteCount.weekly} cigarette${cigaretteCount.weekly !== 1 ? 's' : ''} this week`;
        cigaretteCountElements.monthly.textContent = `${cigaretteCount.monthly} cigarette${cigaretteCount.monthly !== 1 ? 's' : ''} this month`;
    }

    function updateCostDisplay() {
        const dailyCost = historicalData.filter(entry => {
            const today = new Date();
            return entry.date.toDateString() === today.toDateString();
        }).reduce((sum, entry) => sum + entry.cost, 0);

        const weeklyCost = historicalData.filter(entry => {
            const today = new Date();
            const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            return entry.date >= weekAgo;
        }).reduce((sum, entry) => sum + entry.cost, 0);

        const monthlyCost = historicalData.filter(entry => {
            const today = new Date();
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            return entry.date >= monthAgo;
        }).reduce((sum, entry) => sum + entry.cost, 0);

        const yearlyCost = historicalData.filter(entry => {
            const today = new Date();
            const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            return entry.date >= yearAgo;
        }).reduce((sum, entry) => sum + entry.cost, 0);

        costDisplayElements.daily.textContent = dailyCost.toFixed(2);
        costDisplayElements.weekly.textContent = weeklyCost.toFixed(2);
        costDisplayElements.monthly.textContent = monthlyCost.toFixed(2);
        costDisplayElements.yearly.textContent = yearlyCost.toFixed(2);
    }

    function updateSmokeFreeTime() {
        if (lastCigaretteTime) {
            const timeDiff = new Date() - lastCigaretteTime;
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const months = Math.floor(days / 30);
            const years = Math.floor(months / 12);

            smokeFreeTimeElement.textContent = `${days % 30} Days ${months % 12} Months ${years} Years`;
        } else {
            smokeFreeTimeElement.textContent = '0 Days 0 Months 0 Years';
        }
    }

    function updateHealthImprovements() {
        if (!lastCigaretteTime) {
            healthImprovementsElement.innerHTML = '<p>"Every journey begins with a single step. Take that step towards a smoke-free life today."</p>';
            return;
        }

        const timeDiff = new Date() - lastCigaretteTime;
        const hours = timeDiff / (1000 * 60 * 60);
        const days = hours / 24;

        const improvements = [
            { time: 0.33, text: 'Your heart rate is beginning to drop.' },
            { time: 8, text: 'Nicotine and carbon monoxide levels in your blood have reduced by more than half.' },
            { time: 20, text: 'Your blood pressure and pulse rate have returned to normal.' },
            { time: 48, text: 'Your ability to taste and smell is improving.' },
            { time: 72, text: 'Your breathing is becoming easier as your bronchial tubes begin to relax.' },
            { time: 168, text: 'Your circulation has improved.' },
            { time: 336, text: 'Your lung function is starting to improve.' },
            { time: 2160, text: 'Your risk of heart attack has significantly decreased.' },
            { time: 8760, text: 'Your risk of coronary heart disease is now half that of a smoker.' }
        ];

        const achievedImprovements = improvements
            .filter(improvement => hours >= improvement.time)
            .map(improvement => `<p>✅ ${improvement.text}</p>`);

        if (achievedImprovements.length > 0) {
            healthImprovementsElement.innerHTML = achievedImprovements.join('');
        } else {
            const nextImprovement = improvements.find(improvement => hours < improvement.time);
            const timeToNext = (nextImprovement.time - hours).toFixed(1);
            healthImprovementsElement.innerHTML = `<p>Great start! In ${timeToNext} hours: ${nextImprovement.text}</p>`;
        }

        // Add overall progress
        const overallProgress = `<p><strong>You've been smoke-free for ${Math.floor(days)} days and ${Math.floor(hours % 24)} hours!</strong></p>`;
        healthImprovementsElement.innerHTML = overallProgress + healthImprovementsElement.innerHTML;
    }

    function updateHistoricalData() {
        const now = new Date();
        let startDate, endDate, label;

        if (currentView === 'weekly') {
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7 * currentPeriodIndex);
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6);
            label = `Week of ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        } else if (currentView === 'monthly') {
            endDate = new Date(now.getFullYear(), now.getMonth() - currentPeriodIndex, 0);
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            label = `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`;
        } else {
            endDate = new Date(now.getFullYear() - currentPeriodIndex, 11, 31);
            startDate = new Date(endDate.getFullYear(), 0, 1);
            label = startDate.getFullYear().toString();
        }

        currentPeriodElement.textContent = label;

        const filteredData = historicalData.filter(entry => entry.date >= startDate && entry.date <= endDate);
        
        const labels = [];
        const data = [];

        if (currentView === 'weekly') {
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                data.push(filteredData.filter(entry => entry.date.toDateString() === date.toDateString()).reduce((sum, entry) => sum + entry.count, 0));
            }
        } else if (currentView === 'monthly') {
            const daysInMonth = endDate.getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(i.toString());
                const date = new Date(startDate.getFullYear(), startDate.getMonth(), i);
                data.push(filteredData.filter(entry => entry.date.toDateString() === date.toDateString()).reduce((sum, entry) => sum + entry.count, 0));
            }
        } else {
            for (let i = 0; i < 12; i++) {
                labels.push(new Date(startDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }));
                const monthData = filteredData.filter(entry => entry.date.getMonth() === i);
                data.push(monthData.reduce((sum, entry) => sum + entry.count, 0));
            }
        }

        const ctx = document.getElementById('historical-chart').getContext('2d');
        if (window.myChart) {
            window.myChart.destroy();
        }
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cigarettes',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Cigarettes'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    function updateTrends() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const weekData = historicalData.filter(entry => entry.date >= oneWeekAgo);
        const monthData = historicalData.filter(entry => entry.date >= oneMonthAgo);

        const weeklyAverage = weekData.reduce((sum, entry) => sum + entry.count, 0) / 7;
        const monthlyAverage = monthData.reduce((sum, entry) => sum + entry.count, 0) / 30;

        weeklyAverageElement.textContent = weeklyAverage.toFixed(1);
        monthlyAverageElement.textContent = monthlyAverage.toFixed(1);

        const previousWeekData = historicalData.filter(entry => entry.date >= new Date(oneWeekAgo.getFullYear(), oneWeekAgo.getMonth(), oneWeekAgo.getDate() - 7) && entry.date < oneWeekAgo);
        const previousWeekAverage = previousWeekData.reduce((sum, entry) => sum + entry.count, 0) / 7;

        const comparison = weeklyAverage - previousWeekAverage;
        comparisonElement.textContent = comparison > 0 ? `Increased by ${comparison.toFixed(1)}` : comparison < 0 ? `Decreased by ${Math.abs(comparison).toFixed(1)}` : 'No change';

        const streaks = [];
        let currentStreak = 0;
        let lastDate = null;

        for (const entry of historicalData) {
            if (lastDate === null || (entry.date - lastDate) / (1000 * 60 * 60 * 24) > 1) {
                if (currentStreak > 0) {
                    streaks.push(currentStreak);
                }
                currentStreak = 0;
            }
            currentStreak++;
            lastDate = entry.date;
        }
        streaks.push(currentStreak);

        const sortedStreaks = streaks.sort((a, b) => b - a);
        longestStreakElement.textContent = `${sortedStreaks[0]} days`;
        previousStreakElement.textContent = sortedStreaks.length > 1 ? `${sortedStreaks[1]} days` : 'N/A';
    }

    function updateTriggerTrends() {
        let startDate, endDate;
        const now = new Date();

        if (currentTriggerView === 'weekly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            endDate = now;
        } else if (currentTriggerView === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            endDate = now;
        } else if (currentTriggerView === 'custom') {
            startDate = new Date(startDateInput.value);
            endDate = new Date(endDateInput.value);
        }

        const filteredData = historicalData.filter(entry => entry.date >= startDate && entry.date <= endDate);

        const triggerCounts = {};
        filteredData.forEach(entry => {
            triggerCounts[entry.trigger] = (triggerCounts[entry.trigger] || 0) + 1;
        });

        const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);

        const labels = sortedTriggers.map(trigger => trigger[0]);
        const data = sortedTriggers.map(trigger => trigger[1]);

        const ctx = document.getElementById('trigger-chart').getContext('2d');
        if (window.triggerChart) {
            window.triggerChart.destroy();
        }
        window.triggerChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Trigger Frequency',
                    data: data,
                    backgroundColor: labels.map(trigger => TRIGGER_COLORS[trigger] || 'rgba(159, 159, 159, 0.6)'),
                    borderColor: labels.map(trigger => TRIGGER_COLORS[trigger]?.replace('0.6', '1') || 'rgba(159, 159, 159, 1)'),
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false  // Hide legend since each bar has a different color
                    }
                }
            }
        });

        // Update top triggers list with matching colors
        const topTriggersList = document.getElementById('top-triggers-list');
        topTriggersList.innerHTML = '';
        for (let i = 0; i < Math.min(3, sortedTriggers.length); i++) {
            const trigger = sortedTriggers[i][0];
            const count = sortedTriggers[i][1];
            const li = document.createElement('li');
            li.innerHTML = `<span style="color: ${TRIGGER_COLORS[trigger]?.replace('0.6', '1') || 'rgba(159, 159, 159, 1)'}">
                ${trigger}: ${count} times</span>`;
            topTriggersList.appendChild(li);
        }
    }

    async function logCigarette() {
        const now = new Date();
        const selectedTrigger = document.querySelector('.trigger-option.selected');
        const trigger = selectedTrigger ? selectedTrigger.dataset.trigger : 'Other';
        const cost = customPriceInput.value ? parseFloat(customPriceInput.value) : selectedPrice;

        const entry = {
            date: now,
            count: 1,
            trigger: trigger,
            cost: cost
        };

        try {
            await addEntry(entry);
            historicalData.push(entry);
            
            // Update counts
            cigaretteCount.daily++;
            cigaretteCount.weekly++;
            cigaretteCount.monthly++;
            
            updateCigaretteCount();
            updateCostDisplay();
            updateSmokeFreeTime();
            updateHealthImprovements();
            updateHistoricalData();
            updateTrends();
            updateTriggerTrends();
        } catch (error) {
            console.error("Error logging cigarette:", error);
        }
    }

    async function loadHistoricalData() {
        try {
            historicalData = await getAllEntries();
            
            // Calculate counts
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

            cigaretteCount.daily = historicalData.filter(entry => 
                entry.date >= today
            ).length;

            cigaretteCount.weekly = historicalData.filter(entry => 
                entry.date >= weekAgo
            ).length;

            cigaretteCount.monthly = historicalData.filter(entry => 
                entry.date >= monthAgo
            ).length;

            updateCigaretteCount();
            updateCostDisplay();
            updateSmokeFreeTime();
            updateHealthImprovements();
            updateHistoricalData();
            updateTrends();
            updateTriggerTrends();
        } catch (error) {
            console.error("Error loading historical data:", error);
        }
    }

    // 4. Initialize IndexedDB and load data
    try {
        await openDB();
        console.log("IndexedDB opened successfully");
        await loadHistoricalData();
    } catch (error) {
        console.error("Error opening IndexedDB:", error);
    }

    // 5. Set up event listeners
    logCigaretteButton.addEventListener('click', logCigarette);

    triggerOptions.forEach(option => {
        option.addEventListener('click', () => {
            triggerOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    priceOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedPrice = parseFloat(option.dataset.price);
            priceOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            customPriceInput.value = '';
        });
    });

    customPriceInput.addEventListener('input', () => {
        if (customPriceInput.value) {
            priceOptions.forEach(opt => opt.classList.remove('selected'));
        }
    });

    function resetDailyCount() {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 0
        );
        const msToMidnight = night.getTime() - now.getTime();

        setTimeout(() => {
            cigaretteCount.daily = 0;
            updateCigaretteCount();
            updateCostDisplay();
            resetDailyCount();
        }, msToMidnight);
    }

    function resetWeeklyCount() {
        const now = new Date();
        const sunday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + (7 - now.getDay()),
            0, 0, 0
        );
        const msToSunday = sunday.getTime() - now.getTime();

        setTimeout(() => {
            cigaretteCount.weekly = 0;
            updateCigaretteCount();
            updateCostDisplay();
            resetWeeklyCount();
        }, msToSunday);
    }

    function resetMonthlyCount() {
        const now = new Date();
        const firstOfNextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1,
            0, 0, 0
        );
        const msToFirstOfMonth = firstOfNextMonth.getTime() - now.getTime();

        setTimeout(() => {
            cigaretteCount.monthly = 0;
            updateCigaretteCount();
            updateCostDisplay();
            resetMonthlyCount();
        }, msToFirstOfMonth);
    }

    resetDailyCount();
    resetWeeklyCount();
    resetMonthlyCount();

    // Tab switching
    mainTab.addEventListener('click', () => {
        mainTab.classList.add('active');
        historyTab.classList.remove('active');
        mainContent.classList.remove('hidden');
        historyContent.classList.add('hidden');
    });

    historyTab.addEventListener('click', () => {
        historyTab.classList.add('active');
        mainTab.classList.remove('active');
        historyContent.classList.remove('hidden');
        mainContent.classList.add('hidden');
        updateHistoricalData();
        updateTriggerTrends();
    });

    historicalDataTab.addEventListener('click', () => {
        historicalDataTab.classList.add('active');
        trendsTab.classList.remove('active');
        triggerTrendsTab.classList.remove('active');
        historicalDataSection.classList.remove('hidden');
        trendsSection.classList.add('hidden');
        triggerTrendsSection.classList.add('hidden');
    });

    trendsTab.addEventListener('click', () => {
        trendsTab.classList.add('active');
        historicalDataTab.classList.remove('active');
        triggerTrendsTab.classList.remove('active');
        trendsSection.classList.remove('hidden');
        historicalDataSection.classList.add('hidden');
        triggerTrendsSection.classList.add('hidden');
    });

    triggerTrendsTab.addEventListener('click', () => {
        triggerTrendsTab.classList.add('active');
        historicalDataTab.classList.remove('active');
        trendsTab.classList.remove('active');
        triggerTrendsSection.classList.remove('hidden');
        historicalDataSection.classList.add('hidden');
        trendsSection.classList.add('hidden');
        updateTriggerTrends();
    });

    // View switching
    viewOptions.forEach(option => {
        option.addEventListener('click', () => {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            currentView = option.dataset.view;
            currentPeriodIndex = 0;
            updateHistoricalData();
        });
    });

    triggerViewOptions.forEach(option => {
        option.addEventListener('click', () => {
            triggerViewOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            currentTriggerView = option.dataset.view;
            if (currentTriggerView === 'custom') {
                customDateRange.classList.remove('hidden');
            } else {
                customDateRange.classList.add('hidden');
                updateTriggerTrends();
            }
        });
    });

    prevPeriodButton.addEventListener('click', () => {
        currentPeriodIndex++;
        updateHistoricalData();
    });

    nextPeriodButton.addEventListener('click', () => {
        if (currentPeriodIndex > 0) {
            currentPeriodIndex--;
            updateHistoricalData();
        }
    });

    applyCustomRangeButton.addEventListener('click', updateTriggerTrends);

    // Initial updates
    updateCigaretteCount();
    updateCostDisplay();
    updateSmokeFreeTime();
    updateHealthImprovements();
    updateHistoricalData();
    updateTrends();
    updateTriggerTrends();

    // Update smoke-free time and health improvements every minute
    setInterval(() => {
        updateSmokeFreeTime();
        updateHealthImprovements();
    }, 60000);

    // 5. Set up event listeners
    const themeSwitch = document.querySelector('.theme-switch');
    themeSwitch.addEventListener('click', () => {
        const currentTheme = themeSwitch.getAttribute('data-active');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update switch state
        themeSwitch.setAttribute('data-active', newTheme);
        
        // Update icon
        const switchHandle = themeSwitch.querySelector('.switch-handle');
        switchHandle.innerHTML = newTheme === 'light' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        
        // Update document theme
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save preference
        localStorage.setItem('theme', newTheme);
    });

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.setAttribute('data-active', savedTheme);
    const switchHandle = themeSwitch.querySelector('.switch-handle');
    switchHandle.innerHTML = savedTheme === 'light' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';

    // Add these functions after your other function definitions

    async function backupData() {
        try {
            const data = await getAllEntries();
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.download = `smoking-tracker-backup-${date}.json`;
            a.href = url;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error backing up data:', error);
            alert('Failed to backup data. Please try again.');
        }
    }

    async function restoreData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!Array.isArray(data)) {
                throw new Error('Invalid backup file format');
            }
            
            // Clear existing data
            await clearAllEntries();
            
            // Restore each entry
            for (const entry of data) {
                // Convert date strings back to Date objects
                entry.date = new Date(entry.date);
                await addEntry(entry);
            }
            
            // Reload data
            await loadHistoricalData();
            alert('Data restored successfully!');
        } catch (error) {
            console.error('Error restoring data:', error);
            alert('Failed to restore data. Please check the backup file and try again.');
        }
    }

    // Add these to your event listeners section
    const backupButton = document.getElementById('backup-data');
    const restoreButton = document.getElementById('restore-data');
    const restoreInput = document.getElementById('restore-input');

    backupButton.addEventListener('click', backupData);

    restoreButton.addEventListener('click', () => {
        restoreInput.click();
    });

    restoreInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const confirmed = confirm(
                'Warning: This will replace all existing data with the backup data. ' +
                'Are you sure you want to continue?'
            );
            if (confirmed) {
                await restoreData(file);
            }
        }
        // Clear the input so the same file can be selected again
        event.target.value = '';
    });

    // Add to your DOM element selections
    const backupRestoreTab = document.getElementById('backup-restore-tab');
    const backupRestoreSection = document.getElementById('backup-restore');

    // Add to your tab switching event listeners
    backupRestoreTab.addEventListener('click', () => {
        // Remove active class from all tabs
        historicalDataTab.classList.remove('active');
        trendsTab.classList.remove('active');
        triggerTrendsTab.classList.remove('active');
        backupRestoreTab.classList.add('active');

        // Hide all sections
        historicalDataSection.classList.add('hidden');
        trendsSection.classList.add('hidden');
        triggerTrendsSection.classList.add('hidden');
        backupRestoreSection.classList.remove('hidden');
    });

    // Update other tab click handlers to also hide backup-restore section
    historicalDataTab.addEventListener('click', () => {
        historicalDataTab.classList.add('active');
        trendsTab.classList.remove('active');
        triggerTrendsTab.classList.remove('active');
        backupRestoreTab.classList.remove('active');
        historicalDataSection.classList.remove('hidden');
        trendsSection.classList.add('hidden');
        triggerTrendsSection.classList.add('hidden');
        backupRestoreSection.classList.add('hidden');
    });

    // Do the same for trends and trigger-trends tab click handlers

    // Add this helper function
    function sanitizeInput(input) {
        return input.replace(/[<>]/g, '');
    }

    // Use it when handling user input
    customPriceInput.value = sanitizeInput(customPriceInput.value);
});