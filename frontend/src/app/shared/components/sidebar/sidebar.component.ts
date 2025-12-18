import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>TestMyPolicy</h2>
        <span class="subtitle">Admin Panel</span>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </a>

        <div class="nav-section">
          <span class="section-title">Master Data</span>
        </div>

        <a routerLink="/categories" routerLinkActive="active" class="nav-item">
          <span class="icon">📁</span>
          <span>Categories</span>
        </a>

        <a routerLink="/features" routerLinkActive="active" class="nav-item">
          <span class="icon">✨</span>
          <span>Features</span>
        </a>

        <a routerLink="/companies" routerLinkActive="active" class="nav-item">
          <span class="icon">🏢</span>
          <span>Companies</span>
        </a>

        <a routerLink="/plans" routerLinkActive="active" class="nav-item">
          <span class="icon">📋</span>
          <span>Plans</span>
        </a>

        <div class="nav-section">
          <span class="section-title">Extraction</span>
        </div>

        <a routerLink="/extraction/prompts" routerLinkActive="active" class="nav-item">
          <span class="icon">⚙️</span>
          <span>Extraction Prompts</span>
        </a>

        <a routerLink="/extraction/upload" routerLinkActive="active" class="nav-item">
          <span class="icon">📤</span>
          <span>Upload Brochure</span>
        </a>

        <a routerLink="/extraction/verify" routerLinkActive="active" class="nav-item">
          <span class="icon">✅</span>
          <span>Verify & Save</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: #1a1a2e;
      color: #fff;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #2a2a4a;
      text-align: center;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #4a9eff;
    }

    .subtitle {
      font-size: 0.8rem;
      color: #888;
    }

    .sidebar-nav {
      padding: 15px 0;
    }

    .nav-section {
      padding: 15px 20px 5px;
    }

    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 1px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #ccc;
      text-decoration: none;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: #2a2a4a;
      color: #fff;
    }

    .nav-item.active {
      background: #4a9eff;
      color: #fff;
    }

    .icon {
      margin-right: 12px;
      font-size: 1.1rem;
    }
  `],
})
export class SidebarComponent {}
