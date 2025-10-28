import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { ChangepassComponent } from "../../auth/changepass/changepass.component";

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ChangepassComponent], 
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  usuario: any = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
