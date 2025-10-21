(function() {
    console.log("Widget Engine Loaded");

    const WIDGET_API_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets';

    // Find the script tag and get the site_id
    const scriptTag = document.querySelector('script[data-site-id]');
    if (!scriptTag) {
        console.error('Widget script tag with data-site-id not found.');
        return;
    }
    const siteId = scriptTag.getAttribute('data-site-id');
    const apiKey = scriptTag.getAttribute('data-api-key');

    if (!apiKey) {
        console.error('Supabase anon key not provided. Please add data-api-key attribute to the widget script.');
        return;
    }

    async function fetchAndDisplayWidgets() {
        try {
            const response = await fetch(`${WIDGET_API_URL}?site_id=${siteId}` , {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch widgets.');
            }
            const widgets = await response.json();
            console.log('Fetched Widgets:', widgets);
            widgets.forEach(widget => processWidget(widget));
        } catch (error) {
            console.error('Error fetching widgets:', error);
        }
    }

    function processWidget(widget) {
        const config = widget.config;

        // Basic trigger handling
        if (config.triggers.onPageLoad) {
            setTimeout(() => {
                showWidget(config);
            }, (config.timing.delay || 0) * 1000);
        }

        // TODO: Add more trigger handlers like onScroll and onExit
    }

    function showWidget(config) {
        const widgetElement = document.createElement('div');
        const animationSpeed = config.animation.speed === 'slow' ? '1.5s' : config.animation.speed === 'fast' ? '0.5s' : '1s';

        // Apply styles
        Object.assign(widgetElement.style, {
            position: 'fixed',
            zIndex: '9999',
            backgroundColor: config.bgColor,
            color: config.color,
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.5s ease-in-out',
            opacity: '0',
            transform: 'translateY(20px)',
            ...getPositionStyles(config.position)
        });

        // Add animation classes from animate.css
        widgetElement.classList.add('animate__animated', `animate__${config.animation.type}`);
        widgetElement.style.setProperty('--animate-duration', animationSpeed);

        // Set content
        widgetElement.innerHTML = `
            <div style="font-weight: 600; font-size: 14px;">${config.title}</div>
            <div style="font-size: 12px; margin-top: 4px;">${config.content}</div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 8px;">Just now</div>
        `;

        document.body.appendChild(widgetElement);

        // Make it visible
        setTimeout(() => {
            widgetElement.style.opacity = '1';
            widgetElement.style.transform = 'translateY(0)';
        }, 100); // Small delay to allow transition to work

        // Hide after duration
        if (config.timing.displayDuration > 0) {
            setTimeout(() => {
                widgetElement.style.opacity = '0';
                widgetElement.style.transform = 'translateY(20px)';
                setTimeout(() => widgetElement.remove(), 500);
            }, config.timing.displayDuration * 1000);
        }
    }

    function getPositionStyles(position) {
        const styles = {};
        const offsetX = `${position.offsetX || 20}px`;
        const offsetY = `${position.offsetY || 20}px`;

        if (position.placement.includes('bottom')) {
            styles.bottom = offsetY;
        } else {
            styles.top = offsetY;
        }

        if (position.placement.includes('right')) {
            styles.right = offsetX;
        } else {
            styles.left = offsetX;
        }
        return styles;
    }

    // Initial fetch
    fetchAndDisplayWidgets();

})();
