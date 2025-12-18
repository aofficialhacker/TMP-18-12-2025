import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>

      <div class="header-right">
        <div class="user-info" *ngIf="authService.currentUser()">
          <span class="user-name">{{ authService.currentUser()?.name }}</span>
          <span class="user-email">{{ authService.currentUser()?.email }}</span>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      margin-left: 250px;
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 100;
    }

    .page-title {
      margin: 0;
      font-size: 1.25rem;
      color: #333;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 0.8rem;
      color: #666;
    }

    .logout-btn {
      padding: 8px 16px;
      background: #ff4757;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background: #ff6b6b;
    }
  `],
})
export class HeaderComponent {
  authService = inject(AuthService);
  pageTitle = 'Dashboard';

  logout(): void {
    this.authService.logout();
  }
}
