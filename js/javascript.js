document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const mainContent = document.getElementById('main-content');
    const container = document.getElementById('container');

    // Detectar clic o toque para iniciar
    startScreen.addEventListener('click', startAnimation);
    startScreen.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startAnimation();
    });

    function startAnimation() {
        startScreen.style.display = 'none';
        mainContent.style.display = 'block';
        createFallingCirnos();
    }

    function createFallingCirnos() {
        // Crear imágenes de Cirno cada 300ms
        setInterval(() => {
            const cirno = document.createElement('img');
            cirno.src = 'img/cirno.png';
            cirno.classList.add('cirno');
            cirno.style.left = `${Math.random() * (window.innerWidth - 80)}px`; // Ajustado al tamaño
            cirno.style.top = '-100px'; // Comienza fuera de la pantalla (arriba)
            container.appendChild(cirno);

            // Reproducir sonido al aparecer
            playSound();

            // Propiedades físicas
            const physics = {
                x: parseFloat(cirno.style.left),
                y: -100,
                vx: 0, // Velocidad inicial en X
                vy: 0, // Velocidad inicial en Y
                ay: 500, // Aceleración (gravedad) en píxeles/s²
                restitution: 0.7, // Coeficiente de rebote
                rotation: 0, // Rotación en grados
                angularVelocity: Math.random() * 200 - 100, // Velocidad angular aleatoria (-100 a 100 deg/s)
                lastTime: performance.now(),
                isDragging: false,
                dragStart: null
            };

            // Hacer la imagen arrastrable y lanzable
            makeDraggable(cirno, physics);

            // Animar la caída, rebote y rotación
            animateCirno(cirno, physics);
        }, 300);
    }

    function playSound() {
        const audio = new Audio('content/baka.mp3');
        audio.play().catch(error => {
            console.error('Error al reproducir el audio:', error);
        });
        audio.onended = () => {
            audio.src = ''; // Liberar memoria
        };
    }

    function makeDraggable(cirno, physics) {
        let initialX, initialY;

        // Manejar inicio de arrastre
        cirno.addEventListener('mousedown', startDragging);
        cirno.addEventListener('touchstart', startDragging);

        function startDragging(e) {
            e.preventDefault();
            playSound(); // Reproducir sonido al tocar
            physics.isDragging = true;
            physics.vx = 0;
            physics.vy = 0;
            physics.angularVelocity = 0; // Detener rotación al arrastrar

            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - physics.x;
                initialY = e.touches[0].clientY - physics.y;
            } else {
                initialX = e.clientX - physics.x;
                initialY = e.clientY - physics.y;
            }

            physics.dragStart = {
                x: physics.x,
                y: physics.y,
                time: performance.now()
            };

            // Asegurar que los eventos de arrastre estén activos
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
        }

        function drag(e) {
            if (physics.isDragging) {
                e.preventDefault();
                let clientX, clientY;
                if (e.type === 'touchmove') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                physics.x = clientX - initialX;
                physics.y = clientY - initialY;

                cirno.style.left = `${physics.x}px`;
                cirno.style.top = `${physics.y}px`;
            }
        }

        function stopDragging() {
            if (physics.isDragging) {
                physics.isDragging = false;
                // Calcular velocidad de lanzamiento
                const now = performance.now();
                const deltaTime = (now - physics.dragStart.time) / 1000;
                if (deltaTime > 0) {
                    physics.vx = (physics.x - physics.dragStart.x) / deltaTime * 1.5; // Sensibilidad ajustada
                    physics.vy = (physics.y - physics.dragStart.y) / deltaTime * 1.5;
                    physics.angularVelocity = Math.random() * 200 - 100; // Restaurar rotación al soltar
                }
                // Remover eventos de arrastre
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('touchmove', drag);
            }
        }

        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('touchend', stopDragging);
    }

    function animateCirno(cirno, physics) {
        function update() {
            if (!physics.isDragging) {
                const now = performance.now();
                const deltaTime = (now - physics.lastTime) / 1000;
                physics.lastTime = now;

                // Aplicar gravedad
                physics.vy += physics.ay * deltaTime;
                physics.x += physics.vx * deltaTime;
                physics.y += physics.vy * deltaTime;

                // Actualizar rotación
                physics.rotation += physics.angularVelocity * deltaTime;
                cirno.style.transform = `rotate(${physics.rotation}deg)`;

                // Colisión con el suelo
                const ground = window.innerHeight - 80; // Ajustado al tamaño
                if (physics.y > ground) {
                    physics.y = ground;
                    physics.vy *= -physics.restitution;
                    physics.vx *= 0.8; // Fricción en X
                    physics.angularVelocity *= 0.8; // Reducir rotación al rebotar
                    if (Math.abs(physics.vy) < 20) {
                        physics.vy = 0;
                        physics.vx = 0;
                        physics.angularVelocity = 0;
                    }
                }

                // Colisión con bordes laterales
                if (physics.x < 0) {
                    physics.x = 0;
                    physics.vx *= -physics.restitution;
                    physics.angularVelocity *= -0.8; // Cambiar dirección de rotación
                } else if (physics.x > window.innerWidth - 80) {
                    physics.x = window.innerWidth - 80;
                    physics.vx *= -physics.restitution;
                    physics.angularVelocity *= -0.8;
                }

                // Actualizar posición
                cirno.style.left = `${physics.x}px`;
                cirno.style.top = `${physics.y}px`;

                // Eliminar si está inmóvil en el suelo
                if (physics.y >= ground && Math.abs(physics.vy) < 1 && Math.abs(physics.vx) < 1) {
                    setTimeout(() => {
                        if (cirno.parentNode) cirno.remove();
                    }, 2000);
                    return;
                }
            }

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }
});
