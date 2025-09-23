// Modern Zomato Analytics Dashboard
// API-based implementation with Flask backend

class ZomatoDashboard {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.charts = {};
        this.currentData = [];
        this.currentFilters = {
            city: 'all',
            price_range: 'all',
            min_rating: '',
            search: ''
        };
        
        this.init();
    }

    async init() {
        this.showLoadingState();
        await this.loadInitialData();
        this.setupEventListeners();
        this.updateDashboard();
    }

    showLoadingState() {
        const elements = ['totalRestaurants', 'avgRating', 'totalCities'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = 'Loading...';
        });
    }

    async loadInitialData() {
        try {
            // Load cities for filter dropdown
            const cities = await this.fetchAPI('/filters/cities');
            this.populateCityFilter(cities);
            
            // Load initial data and stats
            await this.updateDashboard();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load data. Please ensure the server is running.');
        }
    }

    async fetchAPI(endpoint, params = {}) {
        try {
            const url = new URL(this.baseURL + endpoint);
            Object.keys(params).forEach(key => {
                if (params[key] && params[key] !== 'all') url.searchParams.append(key, params[key]);
            });

            console.log(`Fetching: ${url.toString()}`); // Debug log
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`Response for ${endpoint}:`, data); // Debug log
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    async updateDashboard() {
        try {
            this.showLoadingState();
            
            // Update stats
            const stats = await this.fetchAPI('/stats', this.currentFilters);
            this.updateStats(stats);

            // Update charts
            await this.updateAllCharts();

            // Update insights
            await this.updateInsights();

            // Update table
            await this.updateTable();

        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showError(`Failed to update dashboard data: ${error.message}`);
        }
    }

    updateStats(stats) {
        document.getElementById('totalRestaurants').textContent = stats.total_restaurants.toLocaleString();
        document.getElementById('avgRating').textContent = stats.avg_rating;
        document.getElementById('totalCities').textContent = stats.unique_cities;
    }

    async updateAllCharts() {
        const chartUpdates = [
            this.updateRatingChart(),
            this.updateCityChart(),
            this.updatePriceChart(),
            this.updateCuisineChart(),
            this.updateServicesChart(),
            this.updateCostChart()
        ];

        await Promise.all(chartUpdates);
    }

    async updateRatingChart() {
        const data = await this.fetchAPI('/analytics/rating-distribution', this.currentFilters);
        const ctx = document.getElementById('ratingChart').getContext('2d');

        if (this.charts.rating) this.charts.rating.destroy();

        this.charts.rating = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'
                    ],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    async updateCityChart() {
        const data = await this.fetchAPI('/analytics/top-cities', this.currentFilters);
        const ctx = document.getElementById('cityChart').getContext('2d');

        if (this.charts.city) this.charts.city.destroy();

        this.charts.city = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Number of Restaurants',
                    data: data.values,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    async updatePriceChart() {
        const data = await this.fetchAPI('/analytics/price-distribution', this.currentFilters);
        const ctx = document.getElementById('priceChart').getContext('2d');

        if (this.charts.price) this.charts.price.destroy();

        this.charts.price = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    async updateCuisineChart() {
        const data = await this.fetchAPI('/analytics/popular-cuisines', this.currentFilters);
        const ctx = document.getElementById('cuisineChart').getContext('2d');

        if (this.charts.cuisine) this.charts.cuisine.destroy();

        this.charts.cuisine = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Number of Restaurants',
                    data: data.values,
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y', // This makes it horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    async updateServicesChart() {
        const data = await this.fetchAPI('/analytics/services', this.currentFilters);
        const ctx = document.getElementById('servicesChart').getContext('2d');

        if (this.charts.services) this.charts.services.destroy();

        this.charts.services = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Number of Restaurants',
                    data: Object.values(data),
                    backgroundColor: ['#007bff', '#28a745', '#ffc107'],
                    borderColor: ['#0056b3', '#1e7e34', '#d39e00'],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    async updateCostChart() {
        const data = await this.fetchAPI('/analytics/cost-by-city', this.currentFilters);
        const ctx = document.getElementById('costChart').getContext('2d');

        if (this.charts.cost) this.charts.cost.destroy();

        this.charts.cost = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Average Cost for Two',
                    data: data.values,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ff6b6b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    async updateInsights() {
        try {
            const insights = await this.fetchAPI('/insights', this.currentFilters);
            const container = document.getElementById('insightsContainer');
            
            container.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    <div class="insight-icon">
                        <i class="fas ${this.getInsightIcon(insight.type)}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.content}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error updating insights:', error);
        }
    }

    getInsightIcon(type) {
        const icons = {
            'highlight': 'fa-star',
            'info': 'fa-info-circle',
            'trend': 'fa-trending-up',
            'warning': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-lightbulb';
    }

    async updateTable() {
        try {
            const data = await this.fetchAPI('/data', this.currentFilters);
            this.currentData = data;
            this.renderTable(data.slice(0, 50)); // Show first 50 results
        } catch (error) {
            console.error('Error updating table:', error);
        }
    }

    renderTable(data) {
        const tbody = document.getElementById('tableBody');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No restaurants found matching the current filters.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(restaurant => `
            <tr>
                <td data-label="Restaurant" class="restaurant-name">${restaurant.name}</td>
                <td data-label="City">${restaurant.city}</td>
                <td data-label="Cuisine" class="cuisine-cell">${restaurant.cuisines}</td>
                <td data-label="Rating" class="rating-cell">
                    ${restaurant.rating > 0 ? `${restaurant.rating.toFixed(1)} ⭐` : 'N/A'}
                </td>
                <td data-label="Votes" class="votes-cell">${restaurant.votes.toLocaleString()}</td>
                <td data-label="Cost for Two" class="cost-cell">
                    ${restaurant.cost > 0 ? `₹${restaurant.cost.toLocaleString()}` : 'N/A'}
                </td>
                <td data-label="Services" class="services-cell">
                    ${restaurant.has_booking ? '<span class="service-badge booking" title="Table Booking Available">📅</span>' : ''}
                    ${restaurant.has_delivery ? '<span class="service-badge delivery" title="Online Delivery Available">🚚</span>' : ''}
                    ${restaurant.is_delivering ? '<span class="service-badge delivering" title="Currently Delivering">🟢</span>' : ''}
                    ${!restaurant.has_booking && !restaurant.has_delivery && !restaurant.is_delivering ? '<span class="no-services">—</span>' : ''}
                </td>
            </tr>
        `).join('');
    }

    populateCityFilter(cities) {
        const cityFilter = document.getElementById('cityFilter');
        cityFilter.innerHTML = '<option value="all">All Cities</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }

    setupEventListeners() {
        // Filter change listeners
        document.getElementById('cityFilter').addEventListener('change', (e) => {
            this.currentFilters.city = e.target.value;
            this.updateDashboard();
        });

        document.getElementById('priceFilter').addEventListener('change', (e) => {
            this.currentFilters.price_range = e.target.value;
            this.updateDashboard();
        });

        document.getElementById('ratingFilter').addEventListener('change', (e) => {
            this.currentFilters.min_rating = e.target.value;
            this.updateDashboard();
        });

        // Search with debounce
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value;
                this.updateDashboard();
            }, 300);
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.currentFilters = {
                city: 'all',
                price_range: 'all',
                min_rating: '',
                search: ''
            };
            
            // Reset form elements
            document.getElementById('cityFilter').value = 'all';
            document.getElementById('priceFilter').value = 'all';
            document.getElementById('ratingFilter').value = '';
            document.getElementById('searchInput').value = '';
            
            this.updateDashboard();
        });

        // Sort functionality
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortTable(e.target.value);
        });

        // Export functionality
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportToJSON();
        });

        document.getElementById('printReport').addEventListener('click', () => {
            this.printReport();
        });
    }

    sortTable(sortBy) {
        let sortedData = [...this.currentData];
        
        switch (sortBy) {
            case 'rating':
                sortedData.sort((a, b) => b.rating - a.rating);
                break;
            case 'votes':
                sortedData.sort((a, b) => b.votes - a.votes);
                break;
            case 'cost':
                sortedData.sort((a, b) => b.cost - a.cost);
                break;
            case 'name':
                sortedData.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        this.renderTable(sortedData.slice(0, 50));
    }

    exportToCSV() {
        const headers = ['Restaurant Name', 'City', 'Cuisines', 'Rating', 'Votes', 'Cost for Two', 'Has Booking', 'Has Delivery', 'Is Delivering'];
        const csvContent = [
            headers.join(','),
            ...this.currentData.map(row => [
                `"${row.name}"`,
                `"${row.city}"`,
                `"${row.cuisines}"`,
                row.rating,
                row.votes,
                row.cost,
                row.has_booking,
                row.has_delivery,
                row.is_delivering
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'zomato-restaurants.csv', 'text/csv');
    }

    exportToJSON() {
        const jsonContent = JSON.stringify(this.currentData, null, 2);
        this.downloadFile(jsonContent, 'zomato-restaurants.json', 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    printReport() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Zomato Analytics Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                        .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Zomato Analytics Report</h1>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="stats">
                        <div class="stat-card">
                            <h3>${document.getElementById('totalRestaurants').textContent}</h3>
                            <p>Total Restaurants</p>
                        </div>
                        <div class="stat-card">
                            <h3>${document.getElementById('avgRating').textContent}</h3>
                            <p>Average Rating</p>
                        </div>
                        <div class="stat-card">
                            <h3>${document.getElementById('totalCities').textContent}</h3>
                            <p>Cities</p>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Restaurant</th>
                                <th>City</th>
                                <th>Cuisine</th>
                                <th>Rating</th>
                                <th>Votes</th>
                                <th>Cost for Two</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.currentData.slice(0, 20).map(restaurant => `
                                <tr>
                                    <td>${restaurant.name}</td>
                                    <td>${restaurant.city}</td>
                                    <td>${restaurant.cuisines}</td>
                                    <td>${restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'N/A'}</td>
                                    <td>${restaurant.votes.toLocaleString()}</td>
                                    <td>${restaurant.cost > 0 ? '₹' + restaurant.cost.toLocaleString() : 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZomatoDashboard();
});
