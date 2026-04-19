const navbar = document.querySelector('.site-nav');
const navItems = document.querySelectorAll('.nav-link');
const indicator = document.getElementById('indicator');

function moveIndicator(el) {
  const rect = el.getBoundingClientRect();
  const navRect = navbar.getBoundingClientRect();
  const x = rect.left - navRect.left;
  const width = rect.width;
  
  indicator.style.transform = `translateX(${x}px)`;
  indicator.style.width = `${width}px`;
}

// Initial position - Home active
navItems.forEach(item => {
  if (item.classList.contains('active')) {
    moveIndicator(item);
  }
});

// Click handler
navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    
    // Remove active
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Move indicator
    moveIndicator(item);
  });
});

// Resize handler
window.addEventListener('resize', () => {
  const activeItem = document.querySelector('.nav-link.active');
  if (activeItem) moveIndicator(activeItem);
});
