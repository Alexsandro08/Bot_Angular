import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./landing/landing.module').then((m) => m.LandingModule),
  },
  // Próximas rotas públicas (ainda não criadas):
  // { path: 'planos', loadChildren: () => import('./planos/planos.module')... },
  // { path: 'cadastro', loadChildren: () => import('./cadastro/cadastro.module')... },
  // { path: 'login', loadChildren: () => import('./login/login.module')... },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
