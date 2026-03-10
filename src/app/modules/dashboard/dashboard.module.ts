import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, NgModel } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { StatsGridComponent } from './components/stats-grid/stats-grid.component';
import { OrdersPanelComponent } from './components/orders-panel/orders-panel.component';
import { OrderCardComponent } from './components/order-card/order-card.component';
import { QrModalComponent } from './components/qr-modal/qr-modal.component';
import { ProdutosComponent } from './components/produtos/produtos.component';
import { DashboardComponent } from './dashboard.component';
import { HorarioPipe } from '../../pipes/horario.pipe';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { RelatoriosComponent } from './components/relatorios/relatorios.component';

const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [
    DashboardComponent,
    HeaderComponent,
    SidebarComponent,
    StatsGridComponent,
    OrdersPanelComponent,
    OrderCardComponent,
    QrModalComponent,
    ProdutosComponent,
    HorarioPipe,
    OnboardingComponent,
    NotificationsComponent,
    RelatoriosComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
})
export class DashboardModule {}
