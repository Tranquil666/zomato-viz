// Global variables
let restaurantData = [];
let filteredData = [];
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Show loading state
    showLoadingState();
    loadData();
    setupEventListeners();
});

// Show loading state
function showLoadingState() {
    const elements = ['totalRestaurants', 'avgRating', 'totalCities'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = 'Loading...';
    });
}

// Load and parse CSV data
function loadData() {
    Papa.parse('zomato.csv', {
        download: true,
        header: true,
        complete: function (results) {
            restaurantData = results.data.filter(row => row['Restaurant Name'] && row['Restaurant Name'].trim() !== ''); // Filter out empty rows
            filteredData = [...restaurantData];

            if (restaurantData.length === 0) {
                console.error('No valid data found in CSV file');
                return;
            }

            // Process data
            processData();
            updateStats();
            createCharts();
            populateFilters();
            updateTable();
        },
        error: function (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please make sure zomato.csv is in the same directory as this HTML file.');
        }
    });
}

// Process and clean data
function processData() {
    restaurantData.forEach(restaurant => {
        // Clean numeric values with better error handling
        const rawRating = restaurant['Aggregate rating'];
        restaurant.rating = (rawRating && !isNaN(parseFloat(rawRating))) ? parseFloat(rawRating) : 0;

        const rawVotes = restaurant['Votes'];
        restaurant.votes = (rawVotes && !isNaN(parseInt(rawVotes))) ? parseInt(rawVotes) : 0;

        const rawCost = restaurant['Average Cost for two'];
        restaurant.cost = (rawCost && !isNaN(parseInt(rawCost))) ? parseInt(rawCost) : 0;

        const rawPriceRange = restaurant['Price range'];
        restaurant.priceRange = (rawPriceRange && !isNaN(parseInt(rawPriceRange))) ? parseInt(rawPriceRange) : 0;

        // Clean text values
        restaurant.name = (restaurant['Restaurant Name'] || '').trim() || 'Unknown';
        restaurant.city = (restaurant['City'] || '').trim() || 'Unknown';
        restaurant.cuisine = (restaurant['Cuisines'] || '').trim() || 'Unknown';
        restaurant.ratingText = (restaurant['Rating text'] || '').trim() || 'Not Rated';

        // Boolean services with better checking
        restaurant.hasBooking = (restaurant['Has Table booking'] || '').toLowerCase() === 'yes';
        restaurant.hasDelivery = (restaurant['Has Online delivery'] || '').toLowerCase() === 'yes';
        restaurant.isDelivering = (restaurant['Is delivering now'] || '').toLowerCase() === 'yes';
    });
}

// Update header statistics
function updateStats() {
    const totalRestaurants = filteredData.length;

    // Calculate average rating only for restaurants with ratings > 0
    const ratedRestaurants = filteredData.filter(r => r.rating > 0);
    const avgRating = ratedRestaurants.length > 0
        ? (ratedRestaurants.reduce((sum, r) => sum + r.rating, 0) / ratedRestaurants.length).toFixed(1)
        : '0.0';

    const uniqueCities = new Set(filteredData.map(r => r.city).filter(city => city !== 'Unknown')).size;

    document.getElementById('totalRestaurants').textContent = totalRestaurants.toLocaleString();
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('totalCities').textContent = uniqueCities;
}

// Create all charts
function createCharts() {
    try {
        createRatingChart();
        createCityChart();
        createPriceChart();
        createCuisineChart();
        createServicesChart();
        createCostChart();
    } catch (error) {
        console.error('Error creating charts:', error);
    }
}

// Rating distribution chart
function createRatingChart() {
    const ctx = document.getElementById('ratingChart').getContext('2d');

    const ratingRanges = {
        'Excellent (4.5+)': 0,
        'Very Good (4.0-4.4)': 0,
        'Good (3.5-3.9)': 0,
        'Average (3.0-3.4)': 0,
        'Poor (<3.0)': 0
    };

    filteredData.forEach(restaurant => {
        const rating = restaurant.rating;
        if (rating >= 4.5) ratingRanges['Excellent (4.5+)']++;
        else if (rating >= 4.0) ratingRanges['Very Good (4.0-4.4)']++;
        else if (rating >= 3.5) ratingRanges['Good (3.5-3.9)']++;
        else if (rating >= 3.0) ratingRanges['Average (3.0-3.4)']++;
        else ratingRanges['Poor (<3.0)']++;
    });

    if (charts.rating) charts.rating.destroy();

    charts.rating = new charts(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ratingRanges),
            datasets: [{
                data: Object.values(ratingRanges),
                backgroundColor: [
                    '#28a745',
                    '#17a2b8',
                    '#ffc107',
                    '#fd7e14',
                    '#dc3545'
                ],
                borderWidth: 2,
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
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Top cities chart
function createCityChart() {
    const ctx = document.getElementById('cityChart').getContext('2d');

    const cityCounts = {};
    filteredData.forEach(restaurant => {
        cityCounts[restaurant.city] = (cityCounts[restaurant.city] || 0) + 1;
    });

    const sortedCities = Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    if (charts.city) charts.city.destroy();

    charts.city = new charts(ctx, {
        type: 'bar',
        data: {
            labels: sortedCities.map(([city]) => city),
            datasets: [{
                label: 'Number of Restaurants',
                data: sortedCities.map(([, count]) => count),
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
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}// Pr
ice range charts
function createPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    const priceLabels = {
        1: 'Budget',
        2: 'Affordable',
        3: 'Mid-range',
        4: 'Expensive'
    };

    const priceCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    filteredData.forEach(restaurant => {
        if (restaurant.priceRange >= 1 && restaurant.priceRange <= 4) {
            priceCounts[restaurant.priceRange]++;
        }
    });

    if (charts.price) charts.price.destroy();

    charts.price = new charts(ctx, {
        type: 'pie',
        data: {
            labels: Object.values(priceLabels),
            datasets: [{
                data: Object.values(priceCounts),
                backgroundColor: [
                    '#28a745',
                    '#ffc107',
                    '#fd7e14',
                    '#dc3545'
                ],
                borderWidth: 2,
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
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Popular cuisines chart
function createCuisineChart() {
    const ctx = document.getElementById('cuisineChart').getContext('2d');

    const cuisineCounts = {};
    filteredData.forEach(restaurant => {
        const cuisines = restaurant.cuisine.split(',').map(c => c.trim());
        cuisines.forEach(cuisine => {
            if (cuisine && cuisine !== 'Unknown') {
                cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
            }
        });
    });

    const sortedCuisines = Object.entries(cuisineCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    if (charts.cuisine) charts.cuisine.destroy();

    charts.cuisine = new charts(ctx, {
        type: 'bar',
        data: {
            labels: sortedCuisines.map(([cuisine]) => cuisine),
            datasets: [{
                label: 'Number of Restaurants',
                data: sortedCuisines.map(([, count]) => count),
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Online services chart
function createServicesChart() {
    const ctx = document.getElementById('servicesChart').getContext('2d');

    const serviceCounts = {
        'Table Booking': filteredData.filter(r => r.hasBooking).length,
        'Online Delivery': filteredData.filter(r => r.hasDelivery).length,
        'Currently Delivering': filteredData.filter(r => r.isDelivering).length
    };

    if (charts.services) charts.services.destroy();

    charts.services = new charts(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(serviceCounts),
            datasets: [{
                label: 'Number of Restaurants',
                data: Object.values(serviceCounts),
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(23, 162, 184, 0.8)',
                    'rgba(111, 66, 193, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(111, 66, 193, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Average cost by city chart
function createCostChart() {
    const ctx = document.getElementById('costChart').getContext('2d');

    const cityData = {};
    filteredData.forEach(restaurant => {
        if (!cityData[restaurant.city]) {
            cityData[restaurant.city] = { total: 0, count: 0 };
        }
        if (restaurant.cost > 0) {
            cityData[restaurant.city].total += restaurant.cost;
            cityData[restaurant.city].count++;
        }
    });

    const avgCostByCity = Object.entries(cityData)
        .map(([city, data]) => ({
            city,
            avgCost: data.count > 0 ? data.total / data.count : 0
        }))
        .filter(item => item.avgCost > 0)
        .sort((a, b) => b.avgCost - a.avgCost)
        .slice(0, 8);

    if (charts.cost) charts.cost.destroy();

    charts.cost = new charts(ctx, {
        type: 'line',
        data: {
            labels: avgCostByCity.map(item => item.city),
            datasets: [{
                label: 'Average Cost for Two',
                data: avgCostByCity.map(item => Math.round(item.avgCost)),
                borderColor: 'rgba(255, 107, 107, 1)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(255, 107, 107, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Populate filter dropdowns
function populateFilters() {
    const cityFilter = document.getElementById('cityFilter');

    // Clear existing options except the first one
    while (cityFilter.children.length > 1) {
        cityFilter.removeChild(cityFilter.lastChild);
    }

    const cities = [...new Set(restaurantData.map(r => r.city))]
        .filter(city => city && city !== 'Unknown')
        .sort();

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    const elements = [
        { id: 'cityFilter', event: 'change', handler: applyFilters },
        { id: 'priceFilter', event: 'change', handler: applyFilters },
        { id: 'ratingFilter', event: 'change', handler: applyFilters },
        { id: 'resetFilters', event: 'click', handler: resetFilters },
        { id: 'searchInput', event: 'input', handler: debounce(applyFilters, 300) },
        { id: 'sortBy', event: 'change', handler: updateTable }
    ];

    elements.forEach(({ id, event, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    });
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply filters
function applyFilters() {
    const cityFilter = document.getElementById('cityFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredData = restaurantData.filter(restaurant => {
        const matchesCity = !cityFilter || restaurant.city === cityFilter;
        const matchesPrice = !priceFilter || restaurant.priceRange.toString() === priceFilter;
        const matchesRating = !ratingFilter || restaurant.rating >= parseFloat(ratingFilter);
        const matchesSearch = !searchTerm ||
            restaurant.name.toLowerCase().includes(searchTerm) ||
            restaurant.cuisine.toLowerCase().includes(searchTerm) ||
            restaurant.city.toLowerCase().includes(searchTerm);

        return matchesCity && matchesPrice && matchesRating && matchesSearch;
    });

    updateStats();
    createCharts();
    updateTable();
}

// Reset all filters
function resetFilters() {
    document.getElementById('cityFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    document.getElementById('searchInput').value = '';

    filteredData = [...restaurantData];
    updateStats();
    createCharts();
    updateTable();
}

// Update restaurant table
function updateTable() {
    const sortBy = document.getElementById('sortBy').value;
    const tableBody = document.getElementById('tableBody');

    if (!filteredData || filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No restaurants found</td></tr>';
        return;
    }

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                return b.rating - a.rating;
            case 'votes':
                return b.votes - a.votes;
            case 'cost':
                return b.cost - a.cost;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows (limit to first 50 for performance)
    sortedData.slice(0, 50).forEach(restaurant => {
        const row = document.createElement('tr');

        const ratingClass = getRatingClass(restaurant.ratingText);
        const servicesIcons = getServicesIcons(restaurant);

        // Escape HTML to prevent XSS
        const escapedName = escapeHtml(restaurant.name);
        const escapedCity = escapeHtml(restaurant.city);
        const escapedCuisine = escapeHtml(restaurant.cuisine);

        row.innerHTML = `
            <td><strong>${escapedName}</strong></td>
            <td>${escapedCity}</td>
            <td>${escapedCuisine}</td>
            <td>
                <span class="rating-badge ${ratingClass}">
                    ${restaurant.rating.toFixed(1)} ⭐
                </span>
            </td>
            <td>${restaurant.votes.toLocaleString()}</td>
            <td>${restaurant.cost > 0 ? restaurant.cost.toLocaleString() : 'N/A'}</td>
            <td>${servicesIcons}</td>
        `;

        tableBody.appendChild(row);
    });

    // Show message if more than 50 results
    if (sortedData.length > 50) {
        const messageRow = document.createElement('tr');
        messageRow.innerHTML = `
            <td colspan="7" style="text-align: center; font-style: italic; color: #666;">
                Showing first 50 of ${sortedData.length} results
            </td>
        `;
        tableBody.appendChild(messageRow);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get rating class for styling
function getRatingClass(ratingText) {
    switch (ratingText.toLowerCase()) {
        case 'excellent':
            return 'excellent';
        case 'very good':
            return 'very-good';
        case 'good':
            return 'good';
        default:
            return 'average';
    }
}

// Get services icons
function getServicesIcons(restaurant) {
    const icons = [];

    if (restaurant.hasBooking) {
        icons.push('<span class="service-icon booking" title="Table Booking">📅</span>');
    }

    if (restaurant.hasDelivery) {
        icons.push('<span class="service-icon delivery" title="Online Delivery">🚚</span>');
    }

    if (restaurant.isDelivering) {
        icons.push('<span class="service-icon online" title="Currently Delivering">🟢</span>');
    }

    if (icons.length === 0) {
        icons.push('<span style="color: #999;">None</span>');
    }

    return `<div class="services-icons">${icons.join('')}</div>`;
}