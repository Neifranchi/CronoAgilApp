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

        // Inicializar gráficos
        this.categoryPieChart = null;
        this.classBarChart = null;
        this.createCharts();
    }

    createCharts() {
        const ctxPie = document.getElementById('categoryPieChart').getContext('2d');
        const ctxBar = document.getElementById('classBarChart').getContext('2d');

        // Gráfico de Pizza para categorias
        this.categoryPieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Categoria D', 'Categoria N', 'Categoria A', 'Categoria N/A'],
                datasets: [{
                    label: 'Tempo por Categoria',
                    data: [0, 0, 0, 0], // Dados serão atualizados depois
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                }]
            },
            options: {
                responsive: true
            }
        });

        // Gráfico de Barras para comparação entre Hora do Roteiro e Classes N e A
        this.classBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Hora do Roteiro', 'Categoria N', 'Categoria A'],
                datasets: [{
                    label: 'Tempo em Segundos',
                    data: [0, 0, 0], // Hora do roteiro, categoria N e A
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Atualiza o gráfico de pizza com os novos valores de cada categoria
    updatePieChart() {
        const totalD = this.calculateTotalTime('D');
        const totalN = this.calculateTotalTime('N');
        const totalA = this.calculateTotalTime('A');
        const totalNA = this.calculateTotalTime('NA');

        this.categoryPieChart.data.datasets[0].data = [totalD, totalN, totalA, totalNA];
        this.categoryPieChart.update();
    }

    // Atualiza o gráfico de barras comparando a Hora do Roteiro com o tempo das classes N e A
    updateBarChart() {
        const horaRoteiro = document.getElementById('hh').value ? parseInt(document.getElementById('hh').value) * 3600 : 0;
        const totalN = this.calculateTotalTime('N');
        const totalA = this.calculateTotalTime('A');

        this.classBarChart.data.datasets[0].data = [horaRoteiro, totalN, totalA];
        this.classBarChart.update();
    }

    // Função auxiliar para calcular o tempo total de uma categoria
    calculateTotalTime(category) {
        const timersInCategory = this.timers.filter(t => t.category === category);
        return timersInCategory.reduce((total, timer) => total + timer.timeElapsed, 0);
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

        // Atualizar o gráfico de barras com a hora do roteiro
        this.updateBarChart();
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

            // Atualizar os gráficos ao adicionar cronômetro
            this.updatePieChart();
            this.updateBarChart();
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

            // Atualizar gráficos ao iniciar um cronômetro
            this.updatePieChart();
            this.updateBarChart();
        }
    }

    stopTimer(timer) {
        clearInterval(timer.interval);
        timer.running = false;

        const button = document.querySelector(`button[data-timer="${timer.id}"]`);
        button.textContent = "Iniciar";
        button.classList.remove("active");
        button.disabled = false;

        this.updateCategoryTotal(timer.category);

        // Atualizar os gráficos ao parar um cronômetro
        this.updatePieChart();
        this.updateBarChart();
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

        // Atualizar gráficos ao parar todos os cronômetros
        ['D', 'N', 'A', 'NA'].forEach(category => this.updateCategoryTotal(category));
        this.updatePieChart();
        this.updateBarChart();
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

        // Atualizar gráficos ao remover um cronômetro
        this.updatePieChart();
        this.updateBarChart();
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

        // Atualizar gráficos ao atualizar o tempo total
        this.updatePieChart();
        this.updateBarChart();
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

        // Atualizar gráficos ao resetar todos os cronômetros
        this.updatePieChart();
        this.updateBarChart();
    }

    startAllTimers() {
        window.location.reload();
    }
}

const timerManager = new TimerManager();

