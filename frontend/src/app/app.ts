import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container" [class.with-sidebar]="authService.isLoggedIn()">
      <app-sidebar *ngIf="authService.isLoggedIn()"></app-sidebar>
      <app-header *ngIf="authService.isLoggedIn()"></app-header>
      <main class="main-content" [class.authenticated]="authService.isLoggedIn()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .main-content {
      min-height: 100vh;
    }

    .main-content.authenticated {
      margin-left: 250px;
      padding-top: 60px;
    }
  `],
})
export class App {
  authService = inject(AuthService);
}
