// ProofPop Widget Tester Script
// Handles all widget testing functionality

// Statistics tracking
let stats = {
    visitors: 0,
    purchases: 0,
    signups: 0,
    cartItems: 0
};

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('proofpop-test-stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('proofpop-test-stats', JSON.stringify(stats));
    updateStatsDisplay();
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('visitor-count').textContent = stats.visitors;
    document.getElementById('purchase-count').textContent = stats.purchases;
    document.getElementById('signup-count').textContent = stats.signups;
    document.getElementById('cart-count').textContent = stats.cartItems;
}

// Log events
function logEvent(type, message) {
    const log = document.getElementById('event-log');
    const item = document.createElement('div');
    item.className = 'event-log-item';
    const timestamp = new Date().toLocaleTimeString();
    item.innerHTML = `<strong>${timestamp}</strong> - ${type}: ${message}`;
    log.insertBefore(item, log.firstChild);
    
    // Keep only last 10 events
    while (log.children.length > 10) {
        log.removeChild(log.lastChild);
    }
}

// Generate random names for testing
const firstNames = ['John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley', 'Michael', 'Amanda'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'London', 'Paris', 'Tokyo', 'Toronto', 'Sydney'];

function getRandomName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

function getRandomCity() {
    return cities[Math.floor(Math.random() * cities.length)];
}

// Test Purchase Widget
function testPurchase(productName, price) {
    const customerName = getRandomName();
    const location = getRandomCity();
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('purchase', {
            customer_name: customerName,
            product_name: productName,
            value: price,
            location: location
        });
        
        stats.purchases++;
        saveStats();
        logEvent('Purchase', `${customerName} purchased ${productName} for $${price}`);
        showNotification(`✅ Purchase tracked: ${productName}`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Test Add to Cart Widget
function testAddToCart(productName, price) {
    const customerName = getRandomName();
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('add_to_cart', {
            customer_name: customerName,
            product_name: productName,
            value: price
        });
        
        stats.cartItems++;
        saveStats();
        logEvent('Cart', `${customerName} added ${productName} to cart`);
        showNotification(`✅ Added to cart: ${productName}`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Test Signup Widget
function testSignup() {
    const customerName = getRandomName();
    const location = getRandomCity();
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('signup', {
            customer_name: customerName,
            location: location
        });
        
        stats.signups++;
        saveStats();
        logEvent('Signup', `${customerName} signed up from ${location}`);
        showNotification(`✅ Signup tracked: ${customerName}`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Test Review Widget
function testReview() {
    const customerName = getRandomName();
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
    const reviews = [
        'Amazing product!',
        'Highly recommended!',
        'Best purchase ever!',
        'Exceeded my expectations!',
        'Outstanding quality!'
    ];
    const reviewText = reviews[Math.floor(Math.random() * reviews.length)];
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('review', {
            customer_name: customerName,
            rating: rating,
            review_text: reviewText
        });
        
        logEvent('Review', `${customerName} left a ${rating}-star review`);
        showNotification(`✅ Review tracked: ${rating} stars`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Test Form Submit Widget
function testFormSubmit() {
    const customerName = getRandomName();
    const location = getRandomCity();
    const formTypes = ['contact form', 'quote request', 'demo request', 'support ticket'];
    const formType = formTypes[Math.floor(Math.random() * formTypes.length)];
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('form_submit', {
            customer_name: customerName,
            form_type: formType,
            location: location
        });
        
        logEvent('Form', `${customerName} submitted ${formType}`);
        showNotification(`✅ Form submission tracked: ${formType}`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Simulate Visitors
function simulateVisitors() {
    const count = Math.floor(Math.random() * 50) + 10;
    stats.visitors = count;
    saveStats();
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('visitor_active', {
            visitor_count: count
        });
        
        logEvent('Visitors', `${count} active visitors`);
        showNotification(`✅ ${count} visitors simulated`, 'success');
    } else {
        console.error('ProofPop not loaded');
        showNotification('❌ ProofPop not loaded', 'error');
    }
}

// Clear all events and stats
function clearAllEvents() {
    stats = {
        visitors: 0,
        purchases: 0,
        signups: 0,
        cartItems: 0
    };
    saveStats();
    
    const log = document.getElementById('event-log');
    log.innerHTML = '<div class="event-log-item">All events cleared</div>';
    
    showNotification('🗑️ All stats cleared', 'success');
}

// Toggle test panel
function toggleTestPanel() {
    const panel = document.getElementById('test-panel-content');
    panel.classList.toggle('active');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#00b894' : '#ff4757'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Contact Form Handler
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    
    // This will be auto-tracked by ProofPop pixel
    logEvent('Form', `Contact form submitted by ${name}`);
    showNotification('✅ Contact form submitted!', 'success');
    
    e.target.reset();
    
    // Wait a bit then show success message
    setTimeout(() => {
        alert('Thank you for contacting us! Your message has been received.\n\n(This is a test - form submission was tracked by ProofPop)');
    }, 500);
});

// Newsletter Form Handler
document.getElementById('newsletter-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('signup', {
            customer_name: name,
            customer_email: email
        });
        
        stats.signups++;
        saveStats();
        logEvent('Signup', `${name} signed up for newsletter`);
    }
    
    showNotification('✅ Thanks for signing up!', 'success');
    e.target.reset();
});

// Review Form Handler
document.getElementById('review-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('review-name') || document.getElementById('review-name').value;
    const rating = document.getElementById('review-rating').value;
    const text = document.getElementById('review-text').value;
    
    if (window.ProofPop && window.ProofPop.track) {
        window.ProofPop.track('review', {
            customer_name: name,
            rating: parseInt(rating),
            review_text: text
        });
        
        logEvent('Review', `${name} left a ${rating}-star review`);
    }
    
    showNotification('✅ Thank you for your review!', 'success');
    e.target.reset();
    
    // Add review to the page
    const reviewsGrid = document.querySelector('.reviews-grid');
    const newReview = document.createElement('div');
    newReview.className = 'review-card';
    newReview.style.animation = 'fadeIn 0.6s ease-out';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const stars = '⭐'.repeat(parseInt(rating));
    
    newReview.innerHTML = `
        <div class="review-header">
            <div class="review-avatar">${initials}</div>
            <div>
                <h4>${name}</h4>
                <div class="stars">${stars}</div>
            </div>
        </div>
        <p>"${text}"</p>
    `;
    
    reviewsGrid.insertBefore(newReview, reviewsGrid.firstChild);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    
    // Simulate initial visitor count
    setTimeout(() => {
        const initialVisitors = Math.floor(Math.random() * 30) + 15;
        stats.visitors = initialVisitors;
        saveStats();
    }, 1000);
    
    // Update visitor count periodically
    setInterval(() => {
        const change = Math.floor(Math.random() * 5) - 2;
        stats.visitors = Math.max(0, stats.visitors + change);
        saveStats();
    }, 10000);
    
    // Log initial load
    logEvent('System', 'ProofPop Widget Tester loaded');
    
    console.log('🧪 ProofPop Widget Tester Ready!');
    console.log('📊 Use the Test Controls panel to trigger widget events');
    console.log('🎯 Or interact with the page normally (forms, purchases, etc.)');
});

// Listen for ProofPop events
window.addEventListener('proofpop:ready', function(e) {
    console.log('✅ ProofPop Ready:', e.detail);
    logEvent('System', 'ProofPop widgets initialized');
    showNotification('✅ ProofPop Loaded Successfully!', 'success');
});

window.addEventListener('proofpop:notification', function(e) {
    console.log('🔔 Notification Displayed:', e.detail);
});

window.addEventListener('proofpop:event-tracked', function(e) {
    console.log('📊 Event Tracked:', e.detail);
});

// Expose test functions globally
window.testPurchase = testPurchase;
window.testAddToCart = testAddToCart;
window.testSignup = testSignup;
window.testReview = testReview;
window.testFormSubmit = testFormSubmit;
window.simulateVisitors = simulateVisitors;
window.clearAllEvents = clearAllEvents;
window.toggleTestPanel = toggleTestPanel;
