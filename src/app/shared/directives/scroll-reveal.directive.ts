import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: false,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() appScrollReveal = 0;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;

    this.renderer.addClass(element, 'reveal-init');
    if (this.appScrollReveal) {
      this.renderer.setStyle(element, 'transition-delay', `${this.appScrollReveal}ms`);
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.addClass(element, 'reveal-visible');
            this.observer?.unobserve(element);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
