import Swal from 'sweetalert2';

export class LoadingHelper {
  static mostrar(titulo: string = 'Cargando...'): void {
    Swal.fire({
      title: titulo,
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#f9fafb', 
      color: '#1f2937', 
      customClass: {
        popup: 'rounded-2xl shadow-md',
        title: 'font-semibold text-gray-800',
      },
    });
  }

  static cerrar(): void {
    Swal.close();
  }

  static error(mensaje: string = 'Error al cargar la información'): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#4F46E5',
    });
  }
}
