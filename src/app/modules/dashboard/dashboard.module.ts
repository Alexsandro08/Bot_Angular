import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    HeaderComponent,
    SidebarComponent,
    StatsGridComponent,
    OrdersPanelComponent,
    OrderCardComponent,
    QrModalComponent,
    ProdutosComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class DashboardModule { }