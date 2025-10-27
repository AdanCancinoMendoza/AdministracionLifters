// src/utils/bidirectional-scroll-animations.js - VERSIÓN COMPLETA
class BidirectionalScrollAnimator {
    constructor() {
        this.observer = null;
        this.scrollDirection = 'down';
        this.lastScrollY = 0;
        this.visibleElements = new Set();
        this.thresholds = {
            desktop: 0.15,
            mobile: 0.08
        };
        this.animationDelays = new Map();
        this.init();
    }

    init() {
        this.setupScrollDirection();
        this.setupIntersectionObserver();
        this.addScrollProgress();
        this.optimizeForMobile();
        this.setupPerformanceOptimizations();
        console.log('🎯 Bidirectional Scroll Animations Initialized - Premium Edition');
    }

    setupScrollDirection() {
        let ticking = false;
        
        const updateScrollDirection = () => {
            const currentScrollY = window.scrollY;
            this.scrollDirection = currentScrollY > this.lastScrollY ? 'down' : 'up';
            this.lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollDirection);
                ticking = true;
            }
        }, { passive: true });
    }

    setupIntersectionObserver() {
        const threshold = this.isMobile() ? this.thresholds.mobile : this.thresholds.desktop;
        
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    this.handleIntersection(entry);
                });
            },
            {
                threshold: threshold,
                rootMargin: this.getRootMargin()
            }
        );

        // Observar elementos con delay para mejor rendimiento
        setTimeout(() => this.observeAllElements(), 100);
    }

    getRootMargin() {
        if (this.isMobile()) {
            return '0px 0px -5% 0px';
        }
        return '0px 0px -10% 0px';
    }

    handleIntersection(entry) {
        const element = entry.target;
        
        if (entry.isIntersecting) {
            this.handleElementInView(element);
        } else if (this.scrollDirection === 'up' && this.visibleElements.has(element)) {
            this.handleElementOutOfView(element);
        }
    }

    observeAllElements() {
        const selectors = [
            '.heroText h1',
            '.heroText p',
            '.heroCta',
            '.mov',
            '.card',
            '.competitor',
            '.fechaItem',
            '.videoCard',
            '.descripcion',
            '.logrosTitle',
            '.sectionHeader',
            '.competitors h3',
            '.texto',
            '.imagenCompetencia',
            '.detallesCompetencia',
            '.calendario',
            '.videosGrid',
            '.posterContainer img'
        ];

        const elements = document.querySelectorAll(selectors.join(','));
        
        elements.forEach((element, index) => {
            this.prepareElementForAnimation(element, index);
            this.observer.observe(element);
        });

        // Observar grupos escalonados
        const staggerGroups = document.querySelectorAll('.stagger-group');
        staggerGroups.forEach(group => {
            this.observer.observe(group);
        });
    }

    prepareElementForAnimation(element, index) {
        // Limpiar clases previas
        this.clearAnimationClasses(element);
        
        // Aplicar clase de animación basada en el tipo de elemento
        const animationClass = this.getAnimationClassForElement(element);
        element.classList.add(animationClass);
        
        // Aplicar delay escalonado
        this.applyStaggerDelay(element, index);
    }

    clearAnimationClasses(element) {
        const animationClasses = [
            'scroll-animate', 'scroll-animate-up', 'scroll-animate-left',
            'scroll-animate-right', 'scroll-animate-scale', 'animated', 'reverse'
        ];
        element.classList.remove(...animationClasses);
    }

    getAnimationClassForElement(element) {
        const tagName = element.tagName.toLowerCase();
        const className = element.className;
        
        // Asignar animaciones basadas en el tipo de elemento
        if (tagName === 'h1' || tagName === 'h2' || className.includes('Title')) {
            return 'scroll-animate-up';
        }
        
        if (className.includes('imagenCompetencia') || className.includes('mov img')) {
            return this.scrollDirection === 'down' ? 'scroll-animate-right' : 'scroll-animate-left';
        }
        
        if (className.includes('texto') || className.includes('competitors') || className.includes('descripcion')) {
            return this.scrollDirection === 'down' ? 'scroll-animate-left' : 'scroll-animate-right';
        }
        
        if (className.includes('mov') || className.includes('card') || className.includes('videoCard')) {
            return 'scroll-animate-scale';
        }
        
        return 'scroll-animate';
    }

    applyStaggerDelay(element, index) {
        const baseDelay = this.isMobile() ? 0.03 : 0.08;
        const elementDelay = this.getElementDelayMultiplier(element);
        const totalDelay = (index * baseDelay) + elementDelay;
        
        this.animationDelays.set(element, totalDelay);
        element.style.setProperty('--animation-delay', `${totalDelay}s`);
    }

    getElementDelayMultiplier(element) {
        const className = element.className;
        
        if (className.includes('heroText')) return 0.2;
        if (className.includes('mov')) return 0.1;
        if (className.includes('card')) return 0.15;
        if (className.includes('competitor')) return 0.05;
        return 0;
    }

    handleElementInView(element) {
        if (this.visibleElements.has(element)) return;
        
        const delay = this.animationDelays.get(element) || 0;
        
        setTimeout(() => {
            element.classList.add('animated');
            this.visibleElements.add(element);
            
            // Efectos específicos para ciertos elementos
            this.applyElementSpecificEffects(element);
        }, delay * 1000);
    }

    handleElementOutOfView(element) {
        if (this.visibleElements.has(element) && this.scrollDirection === 'up') {
            element.classList.add('reverse');
            element.classList.remove('animated');
            this.visibleElements.delete(element);
        }
    }

    applyElementSpecificEffects(element) {
        if (element.classList.contains('mov')) {
            this.animateMovementCard(element);
        }
        
        if (element.classList.contains('competitor')) {
            this.animateCompetitor(element);
        }
        
        if (element.classList.contains('stagger-group')) {
            this.animateStaggerGroup(element);
        }
    }

    animateMovementCard(card) {
        const img = card.querySelector('img');
        if (img && !this.isMobile()) {
            img.style.animation = 'float 4s ease-in-out infinite';
        }
    }

    animateCompetitor(competitor) {
        if (!this.isMobile()) {
            competitor.style.transform = 'translateX(0)';
        }
    }

    animateStaggerGroup(group) {
        const children = group.children;
        Array.from(children).forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
        });
    }

    optimizeForMobile() {
        if (this.isMobile()) {
            this.reduceAnimationIntensity();
            this.optimizeTextAnimations();
        }
    }

    setupPerformanceOptimizations() {
        // Usar transform3d para hardware acceleration
        const style = document.createElement('style');
        style.textContent = `
            .scroll-animate,
            .scroll-animate-up,
            .scroll-animate-left,
            .scroll-animate-right,
            .scroll-animate-scale {
                will-change: transform, opacity;
            }
        `;
        document.head.appendChild(style);
    }

    reduceAnimationIntensity() {
        document.documentElement.style.setProperty('--transition-slow', '300ms ease');
    }

    optimizeTextAnimations() {
        const textElements = document.querySelectorAll('.heroText p, .descripcion p');
        textElements.forEach(element => {
            element.classList.add('text-responsive');
        });
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    addScrollProgress() {
        // Solo agregar barra de progreso en escritorio
        if (this.isMobile()) return;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        let ticking = false;
        
        const updateProgress = () => {
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset;
            const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
            
            progressBar.style.width = `${scrollPercent}%`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }, { passive: true });
    }

    // Método para recargar animaciones
    refresh() {
        this.visibleElements.clear();
        this.observer.disconnect();
        this.setupIntersectionObserver();
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.remove();
        }
    }
}

// Sistema de inicialización mejorado
let scrollAnimator = null;

function initBidirectionalScrollAnimations() {
    if (scrollAnimator) {
        scrollAnimator.destroy();
    }
    
    scrollAnimator = new BidirectionalScrollAnimator();
    
    // Recargar animaciones en resize (con debounce)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            scrollAnimator.refresh();
        }, 250);
    });
}

// Inicialización optimizada
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que el DOM esté completamente cargado
    setTimeout(initBidirectionalScrollAnimations, 100);
});

// API pública para controlar las animaciones
window.ScrollAnimations = {
    init: initBidirectionalScrollAnimations,
    refresh: () => scrollAnimator?.refresh(),
    destroy: () => scrollAnimator?.destroy()
};

// Exportar para uso global
window.BidirectionalScrollAnimator = BidirectionalScrollAnimator;