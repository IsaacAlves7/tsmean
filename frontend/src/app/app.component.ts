import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header__brand">
        <span class="header__ts">ts</span><span class="header__mean">mean</span>
      </div>
      <nav class="header__nav">
        <a routerLink="/users" routerLinkActive="active" class="nav-link">Usuários</a>
      </nav>
    </header>

    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f5f6fa; }

    .header {
      background: #1a1a2e;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 60px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .header__brand {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header__ts   { color: #f5a623; }
    .header__mean { color: #ffffff; }

    .header__nav { display: flex; gap: 1rem; }

    .nav-link {
      color: #aaa;
      text-decoration: none;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }

    .main-content { padding: 2rem; max-width: 1100px; margin: 0 auto; }
  `],
})
export class AppComponent {
  title = 'tsmean';
}
