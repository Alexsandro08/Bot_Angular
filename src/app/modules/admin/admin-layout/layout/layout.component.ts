import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  menuItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Restaurantes', icon: '🍽️', route: '/admin/restaurantes' },
    { label: 'Financeiro', icon: '📋', route: '/admin/orcamentos' },
  ];

  constructor(private auth: AuthService, public router: Router) {}

  logout(): void {
    this.auth.logout();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}