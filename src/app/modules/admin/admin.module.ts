import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutComponent } from './admin-layout/layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinanceiroComponent } from './financeiro/financeiro.component';
import { RestaurantesComponent } from './restaurantes/restaurantes.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'restaurantes', component: RestaurantesComponent },
      { path: 'orcamentos', component: FinanceiroComponent },
    ],
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    FinanceiroComponent,
    RestaurantesComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class AdminModule {}