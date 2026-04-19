// Navbar active button styling only (no indicator needed)
const navbar = document.querySelector('.site-nav');
const navItems = document.querySelectorAll('.nav-link');

// Set initial active (Home)
document.addEventListener('DOMContentLoaded', () => {
  const activeItem = document.querySelector('.nav-link.active') || navItems[0];
  activeItem.classList.add('active');
});

// Click events
navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    
    // No navigation - visual only
  });
});


