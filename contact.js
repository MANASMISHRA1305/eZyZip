// Mobile Menu and Contact Form Functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = mobileMenuBtn.querySelector('i');

  // Toggle mobile menu
  mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.toggle('open');
    
    // Change icon
    const isOpen = mobileMenu.classList.contains('open');
    menuIcon.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
  });

  // Close mobile menu when clicking on a link
  mobileMenu.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      mobileMenu.classList.remove('open');
      menuIcon.setAttribute('class', 'ri-menu-line');
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      menuIcon.setAttribute('class', 'ri-menu-line');
    }
  });

  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(this);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const subject = formData.get('subject');
      const message = formData.get('message');
      
      // Basic validation
      if (!name || !email || !phone || !subject || !message) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      // Phone validation (basic)
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        alert('Please enter a valid phone number.');
        return;
      }
      
      // Show success message
      alert(`Thank you for your message, ${name}! We'll get back to you soon. 💌`);
      
      // Reset form
      this.reset();
    });
  }

  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        alert('Thank you for subscribing to Glow Candles newsletter! 💌');
        this.reset();
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document.querySelectorAll('.info-card, .contact-form-container').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Form field focus effects
  const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      if (!this.value) {
        this.parentElement.classList.remove('focused');
      }
    });
  });
});