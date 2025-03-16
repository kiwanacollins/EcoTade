document.addEventListener('DOMContentLoaded', function() {
    // Get the withdraw button
    const withdrawBtn = document.getElementById('withdraw-btn');
    
    // Add click event listener to the withdraw button
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            // Create a notification element
            const notification = document.createElement('div');
            notification.classList.add('notification', 'error-notification');
            notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> You have zero balance available for withdrawal.';
            
            // Add the notification to the page
            document.body.appendChild(notification);
            
            // Show the notification with animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // Remove the notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        });
    }
});
