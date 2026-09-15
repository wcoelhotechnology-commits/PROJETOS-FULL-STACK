// =============================================================================
//  ASSETFLOW — FRONTEND
//  Autor: Wellington Coelho
//  Arquivo: config.js
//
//  Propósito:
//      Centralizar as constantes de configuração usadas pelos
//      demais arquivos JavaScript da aplicação.
//
//      Este é o primeiro script carregado pelo index.html — nenhum
//      outro arquivo deve rodar antes dele.
// =============================================================================


// Como frontend e backend são servidos pelo mesmo Flask,
// utilizamos uma URL relativa.
//
// Isso evita problemas como:
//
//     localhost:5000
//             x
//     127.0.0.1:5000
//
// e mantém o cookie de sessão no mesmo domínio.
const API_URL = '/api';


// Mapa usado em vários lugares da interface para transformar
// o número do nível de permissão em um texto legível.
const NIVEIS_PERMISSAO = {

    1: 'Colaborador',

    2: 'Gerente',

    3: 'Administrador'
};
