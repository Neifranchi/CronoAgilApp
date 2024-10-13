class TimerManager {
    constructor() {
        this.isFirstTimerStarted = false;
        this.startTime = null;
        this.totalTimeInterval = null;
        this.timers = [];
        this.currentRunningTimer = null;

        document.getElementById('addTimerBtn').addEventListener('click', this.addTimer.bind(this));
        document.getElementById('startAll').addEventListener('click', this.startAllTimers.bind(this));
        document.getElementById('stopAll').addEventListener('click', this.confirmStopAllTimers.bind(this)); // Exibir popup de confirmação
        document.getElementById('resetAll').addEventListener('click', this.resetAllTimers.bind(this));
        document.getElementById('closePopupBtn').addEventListener('click', this.closePopup.bind(this)); // Fechar o popup de boas-vindas
        document.getElementById('cronoForm').addEventListener('submit', this.handleFormSubmission.bind(this)); // Submissão do formulário

        // Elementos do popup de confirmação
        this.confirmationPopup = document.getElementById('confirmation-popup');
        document.getElementById('confirm-stop-btn').addEventListener('click', this.stopAllTimers.bind(this)); // Confirmar parada de todos os cronômetros
        document.getElementById('cancel-stop-btn').addEventListener('click', this.closeConfirmationPopup.bind(this)); // Cancelar parada
    }

    // Exibir popup de confirmação
    confirmStopAllTimers() {
        this.confirmationPopup.style.display = 'block';
    }

    // Fechar popup de confirmação
    closeConfirmationPopup() {
        this.confirmationPopup.style.display = 'none';
    }

    // Fechar o popup de boas-vindas
    closePopup() {
        document.getElementById('welcome-popup').style.display = 'none'; // Esconder o popup
        document.getElementById('op').focus(); // Focar no primeiro campo de preenchimento
    }

    // Submissão do formulário
    handleFormSubmission(event) {
        event.preventDefault(); // Prevenir comportamento padrão do formulário

        // Capturar os valores dos campos
        const op = document.getElementById('op').value;
        const pn = document.getElementById('pn').value;
        const hh = document.getElementById('hh').value;
        const numOperacao = document.getElementById('numOperacao').value;
        const chapa = document.getElementById('chapa').value;
        const dimensional = document.getElementById('dimensional').value;

        // Verificar se todos os campos foram preenchidos
        if (!op || !pn || !hh || !numOperacao || !chapa || !dimensional) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        // Exibir os dados preenchidos no cabeçalho
        const userInfo = document.getElementById('user-info');
        userInfo.textContent = 
            `Número da OP: ${op} | PN da Peça: ${pn} | Hora do Roteiro Atual: ${hh} | Número da Operação: ${numOperacao} | Chapa do Operador: ${chapa} | Dimensional da Peça: ${dimensional}`;

        // Esconder o formulário após a submissão
        document.getElementById('cronoForm').style.display = 'none';
    }

    addTimer() {
        const timerName = document.getElementById('timerName').value.trim();
        const category = document.getElementById('timerCategory').value;

        if (timerName && timerName.length <= 30) {
            const timerElement = document.createElement('div');
            timerElement.classList.add('timer-item');
            const timerId = `timer_${Date.now()}`;

            timerElement.innerHTML = `
                <span class="timer-name">${timerName}</span>
                <span id="${timerId}" class="timer-time">00:00:00</span>
                <button class="btn btn-success start-btn" data-timer="${timerId}" onclick="timerManager.startTimer('${timerId}', '${category}')">Iniciar</button>
                <button class="delete-btn" onclick="timerManager.removeTimer(this, '${category}')">X</button>
            `;

            document.getElementById(`timers${category}`).appendChild(timerElement);

            this.timers.push({
                id: timerId,
                name: timerName,
                category: category,
                interval: null,
                timeElapsed: 0,
                running: false
            });

            this.updateCategoryTotal(category);
        }
    }

    startTimer(timerId, category) {
        if (this.currentRunningTimer) {
            this.stopTimer(this.currentRunningTimer);
        }

        const timer = this.timers.find(t => t.id === timerId);

        if (timer && !timer.running) {
            if (!this.isFirstTimerStarted) {
                const currentTime = new Date().toLocaleTimeString();
                const currentDate = new Date().toLocaleDateString();
                document.getElementById('header-date').textContent = `Data: ${currentDate} Hora início: ${currentTime}`;
                this.isFirstTimerStarted = true;
                this.startTime = new Date();

                this.totalTimeInterval = setInterval(this.updateTotalTime.bind(this), 1000);
            }

            timer.running = true;
            this.currentRunningTimer = timer;

            const button = document.querySelector(`button[data-timer="${timer.id}"]`);
            button.textContent = "Rodando";
            button.classList.add("active");
            button.disabled = true;

            timer.interval = setInterval(() => {
                timer.timeElapsed++;
                const hours = Math.floor(timer.timeElapsed / 3600);
                const minutes = Math.floor((timer.timeElapsed % 3600) / 60);
                const seconds = timer.timeElapsed % 60;

                document.getElementById(timer.id).textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);

            this.updateCategoryTotal(category);
        }
    }

    stopTimer(timer) {
        clearInterval(timer.interval);
        timer.running = false;

        const button = document.querySelector(`button[data-timer="${timer.id}"]`);
        button.textContent = "Iniciar";
        button.classList.remove("active");
        button.disabled = false;

        this.updateCategoryTotal(timer.category); // Atualizar a soma ao parar o cronômetro
    }

    stopAllTimers() {
        this.closeConfirmationPopup(); // Fechar o popup de confirmação

        if (this.currentRunningTimer) {
            this.stopTimer(this.currentRunningTimer);
        }
        this.timers.forEach(timer => {
            if (timer.running) {
                this.stopTimer(timer);
            }
        });
        clearInterval(this.totalTimeInterval);

        // Atualizar o tempo total de todas as categorias ao parar todos os cronômetros
        ['D', 'N', 'A', 'NA'].forEach(category => this.updateCategoryTotal(category));
    }

    removeTimer(element, category) {
        const timerElement = element.parentElement;
        const timerId = timerElement.querySelector('.timer-time').id;
        const timerIndex = this.timers.findIndex(t => t.id === timerId);

        if (timerIndex !== -1) {
            clearInterval(this.timers[timerIndex].interval);
            this.timers.splice(timerIndex, 1);
        }

        timerElement.remove();
        this.updateCategoryTotal(category);
    }

    updateCategoryTotal(category) {
        const timersInCategory = this.timers.filter(t => t.category === category);
        let totalElapsedTime = timersInCategory.reduce((total, timer) => total + timer.timeElapsed, 0);

        const hours = Math.floor(totalElapsedTime / 3600);
        const minutes = Math.floor((totalElapsedTime % 3600) / 60);
        const seconds = totalElapsedTime % 60;

        document.getElementById(`total${category}`).textContent = `Total: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTotalTime() {
        const now = new Date();
        const elapsedTime = Math.floor((now - this.startTime) / 1000);
        const hours = Math.floor(elapsedTime / 3600);
        const minutes = Math.floor((elapsedTime % 3600) / 60);
        const seconds = elapsedTime % 60;

        document.getElementById('total-time').textContent = `Tempo Total Cronoanálise: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    resetAllTimers() {
        this.timers.forEach(timer => {
            clearInterval(timer.interval);
            timer.running = false;
            timer.timeElapsed = 0;
            document.getElementById(timer.id).textContent = '00:00:00';
            const button = document.querySelector(`button[data-timer="${timer.id}"]`);
            button.textContent = "Iniciar";
            button.classList.remove("active");
            button.disabled = false;
        });
        clearInterval(this.totalTimeInterval);
        this.isFirstTimerStarted = false;
        document.getElementById('total-time').textContent = 'Tempo Total Cronoanálise: 00:00:00';
        document.getElementById('header-date').textContent = 'Data: --/--/---- Hora início: --:--:--';

        ['D', 'N', 'A', 'NA'].forEach(category => this.updateCategoryTotal(category));
    }

    startAllTimers() {
        window.location.reload();
    }
}

const timerManager = new TimerManager();

