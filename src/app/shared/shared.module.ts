import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from './directives/scroll-reveal.directive';
import { BackToTopComponent } from './components/back-to-top/back-to-top.component';

@NgModule({
  declarations: [ScrollRevealDirective, BackToTopComponent],
  imports: [CommonModule],
  exports: [ScrollRevealDirective, BackToTopComponent],
})
export class SharedModule {}
