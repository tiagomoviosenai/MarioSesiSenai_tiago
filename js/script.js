document.addEventListener('DOMContentLoaded', () =>{
    // Elementos do jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');
    const startModal = document.getElementById('start-modal');
    const startForm= document.getElementById('start-form');
    const playerInput= document.getElementById('player-input');
});
    // Modais e telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');
    // Variáveis de Estado
    let currentPlayer = '';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    // Recuperação do último nome de usúario ultilizado
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    function startGame(){
        // Limpei Loop anteriores se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        // Resetei as posições visuais
        releaseElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = 0;
        hudPlayerName.textContent = currentPlayer || 'Jogador';
        // Ativa as animações CSS do jogo.
        gameBoard.classList.add('running');
        // Loop de puntuação progressiva (1 ponto a cada 100ms)
        scoreLoop = setInterval(() => {
            if(isPlaying){
                score += 1
                scoreDisplay.textContent = score;

            }
        }, 100);
        // Loop de colisão
        gameLoop = setInterval(checkCollision, 10);
    }
    // Resetar os estilos e posição do Mario e do cano(Obstáculo)
    function resetElements(){
        // Reseta o Cano
        pipe.style.animation = '';
        pipe.style.left ='';

        // Reset do Mario
        mario.src = '../assets/mario.gif';
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');
        if (jumpTip){
        jumpTip.style.opacity = '1';
        }
    }
    // Executa o pulo do Mario
    function jump(){
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if(jumpTip){
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }

    // Verificar a colisão entre o Mario e o Cano
    function checkCollision(){
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
        // Torerâcia de colisão: quando o cano está no faixa de contato com o Mario
        if(pipePosition <= 120 && pipePosition > 0 && marioPosition < 80){
            triggerGameOver(pipePosition, marioPosition);
        }
    }
    // tratar o GameOver
    function triggerGameOver(pipePosition, marioPosition){
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);
        // Remover a classe running para parar as animações
        gameBoard.classList.remove('running');
        // Congela o cano na posição exat da colisão
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`
        // Congela o Mario na altura exata e muda para a imagem de Gamer Over
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = '../assets/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';
        // Atualisação do modal de Gamer Over
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvado pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';
        
        gameoverModal.classList.add('active');
        // Salva a pontuação no banco com a função criada chamada saveScore
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore){
        fetch('salvar_ranking.php' , {
            method: 'POST',
            headers: {
                'Content-Type' : 'aplication/json'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success'){
                saveStatusMsg.textContent = 'Pontuação registrad no banco!';
                saveStatusMsg.style.color = '#10b981';
                if(data.raking){
                    renderRanking(data.ranking, playerName, finalScore)
                }
            } else {
                saveStatusMsg.textContent = (data.message || 'Erro ao registra');
                saveStatusMsg.style.color = "#ef4444";
            }
        })
        .catch(err =>{
            console.error('Erro na requisição', err);
            saveStatusMsg.textContent = 'Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }
    // Busca no ranking atualizado do banco
    function fetchRanking(){
        fetch('obter_ranking.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.ranking){
                renderRanking(data.raking);
            }
        })
        .catch(err => console.error('Erro ao buscar o ranking', err));
    }
    // Vamos atualizar a tabela do ranking no html
    function renderRanking(list, highlightName = null, highlightScore = null){
        if(!rankingBody) return;
        rankingBody.innerHTML = '';
        if(!list || list.length === 0){
            rankingBody.innerHTML = `<tr><td colspan="3" class="loading-call">Nenhuma pontuação gravada ainda.</td></tr>`;
            return;
        }

        let highlightted = false;

        list.forEach((item, index) =>{
            const tr = document.createElement('tr');

            if(!highlightted && highlightName && item.nome == highlightName && parseInt(item.pontos, 10) === highlightScore){
                tr.classList.add('highlight-current');
                highlightted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0 ) medal = '🥇1º';
            else if (index === 1) medal = '🥈2º';
            else if (index === 2) medal = '🥉3º';

            tr,innerHTML = `
            <td class="ranking-pos">${medal}</td>
            <td><strong>${escapeHtml(item.nome)}</strong></td>
            <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        })

    }

    function escapeHtml(str){
        if(!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }

    // eventos de controle e interface do jogo
    // INICIAR O JOGO (FORMULÁRIO)
    startForm.addEventListener('submit', (e) => {
        e.preventDefault(); //Impede o recaregamento da pagina 

        const nameValue = playerInput.value.trim();
        if(!nameValue){
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('mario_jump_player', currentPlayer);
        // Fechar a tela a começa o jogo depois de preencher os dados
        startModal.classList.remove('active');
        startGame();
    });

    // Botão Ver Ranking