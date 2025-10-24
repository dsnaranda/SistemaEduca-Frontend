import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './services/auth/auth.guard'
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AddcursosComponent } from './pages/addcursos/addcursos.component';
import { AddmateriasComponent } from './pages/addmaterias/addmaterias.component';
import { AddestudiantesComponent } from './pages/addestudiantes/addestudiantes.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { RegistrarAsistenciaComponent } from './pages/registrar-asistencia/registrar-asistencia.component';
import { CursosasignadosComponent } from './pages/shared/cursosasignados/cursosasignados.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
    { path: 'addcursos', component: AddcursosComponent, canActivate: [authGuard] },
    { path: 'cursos/:id/materias', component: AddmateriasComponent, canActivate: [authGuard] },
    { path: 'cursos/:id/estudiantes', component: AddestudiantesComponent, canActivate: [authGuard] },
    {
        path: 'asistencia',
        component: AsistenciaComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: CursosasignadosComponent },
            { path: 'registrar/:id', component: RegistrarAsistenciaComponent },
        ],
    },


];
