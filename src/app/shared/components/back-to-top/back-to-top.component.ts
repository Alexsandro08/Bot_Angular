import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  standalone: false,
  templateUrl: './back-to-top.component.html',
  styleUrl: './back-to-top.component.scss',
})
export class BackToTopComponent {
  visible = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.visible = window.scrollY > 400;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
