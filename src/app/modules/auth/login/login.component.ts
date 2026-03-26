import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

declare var particlesJS: any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private iniciarParticles(): void {
    particlesJS('particles-js', {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: '#4f8cff' },
        shape: { type: 'circle' },
        opacity: { value: 0.15, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#4f8cff',
          opacity: 0.08,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: 'none',
          random: true,
          out_mode: 'out',
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'repulse' },
          resize: true,
        },
        modes: {
          repulse: { distance: 80, duration: 0.4 },
        },
      },
      retina_detect: true,
    });
  }

  ngOnInit(): void {
    this.iniciarParticles();
  }

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    login: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  carregando = false;
  erro = false;
  erroMsg = '';
  mostrarErros = false;

  fazerLogin(): void {
    this.mostrarErros = true;
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
          this.erroMsg =
            res.msg === 'Assinatura expirada. Entre em contato para renovar.'
              ? 'Hmm, parece que sua assinatura expirou. Entre em contato para renovar.'
              : 'Login ou senha incorretos.';
          this.carregando = false;
        }
      },
      error: () => {
        this.erro = true;
        this.erroMsg = 'Login ou senha incorretos.';
        this.carregando = false;
      },
    });
  }
}
