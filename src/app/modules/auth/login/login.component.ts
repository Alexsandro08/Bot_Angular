import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

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
        number: { value: 350, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: {
          value: 0.5,
          random: true,
          anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
        },
        size: {
          value: 2,
          random: true,
          anim: { enable: false },
        },
        line_linked: {
          enable: false, // ← sem linhas
        },
        move: {
          enable: true,
          speed: 0.2,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: false },
          onclick: { enable: false },
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
          const token = this.authService.getToken();
          const payload = JSON.parse(atob(token!.split('.')[1]));
          if (payload.isAdmin) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
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


 