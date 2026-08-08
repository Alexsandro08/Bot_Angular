import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LandingRoutingModule } from './landing-routing.module';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { StatsBarComponent } from './components/stats-bar/stats-bar.component';
import { StepsComponent } from './components/steps/steps.component';
import { FeaturesComponent } from './components/features/features.component';
import { PlansComponent } from './components/plans/plans.component';
import { CtaBannerComponent } from './components/cta-banner/cta-banner.component';
import { FooterComponent } from './components/footer/footer.component';
import { WhatsappMockComponent } from './components/whatsapp-mock/whatsapp-mock.component';
import { DashboardMockComponent } from './components/dashboard-mock/dashboard-mock.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    HeaderComponent,
    HeroComponent,
    StatsBarComponent,
    StepsComponent,
    FeaturesComponent,
    PlansComponent,
    CtaBannerComponent,
    FooterComponent,
    WhatsappMockComponent,
    DashboardMockComponent,
  ],
  imports: [CommonModule, RouterModule, LandingRoutingModule, SharedModule],
})
export class LandingModule {}
