import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  usuario: any = null;
  isMenuOpen: boolean = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);
       console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goProfile(): void {
    this.router.navigate(['/perfil']);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goTo(path: string): void {
    this.isMenuOpen = false;
    this.router.navigate([path]);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isMenuOpen = false;
    }
  }
}
