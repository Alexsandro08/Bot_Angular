import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    login: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  erro = false;
  carregando = false;

  fazerLogin(): void {
    if (this.form.invalid) return;
    this.erro = false;
    this.carregando = true;

    const { login, senha } = this.form.value;
    this.authService.login(login, senha).subscribe({
      next: (res) => {
        if (res.ok) {
          this.router.navigate(['/dashboard']);
        } else {
          this.erro = true;
          this.carregando = false;
        }
      },
      error: () => {
        this.erro = true;
        this.carregando = false;
      }
    });
  }
}