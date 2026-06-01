// dashboard.js - roda no navegador, controla dashboard e gráficos

async function carregarDashboard() {
    try {
        const resposta = await fetch('/api/dashboard');

        if (!resposta.ok) {
            // não está logado -> volta pra tela de login
            window.location.href = '/login.html'; // ajuste o nome da sua página de login
            return;
        }

        const { usuario, saldo, transacoes } = await resposta.json();

        // aqui você atualiza os elementos da página
        console.log('Usuário logado:', usuario);
        console.log('Saldo:', saldo);
        console.log('Transações:', transacoes);

        // exemplo: chamar funções que você já tem
        if (typeof atualizarDashboardNaTela === 'function') {
            atualizarDashboardNaTela(usuario, saldo);
        }

        if (typeof atualizarGraficos === 'function') {
            atualizarGraficos(transacoes);
        }
    } catch (erro) {
        console.error('Erro ao carregar dashboard:', erro);
    }
}

// chamar quando a página de dashboard carregar
window.addEventListener('load', carregarDashboard);