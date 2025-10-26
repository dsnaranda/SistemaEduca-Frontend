import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { CursosasignadosComponent } from "../shared/cursosasignados/cursosasignados.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CursosasignadosComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  nombres: string = '';
  apellidos: string = '';

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      const usuario = JSON.parse(data);
      this.nombres = usuario.nombres || '';
      this.apellidos = usuario.apellidos || '';
    }
  }
}