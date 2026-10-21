import { fakerPT_BR as faker } from '@faker-js/faker';
import ProdutoPojo from '../pojo/ProdutoPojo';
import { PREFIXO_MASSA } from '../constants/mensagens';
import { identificadorUnico } from '../utils/dados';

/** Fábrica de produtos: nome único (a API não aceita nomes repetidos) e valores inteiros válidos. */
export const ProdutoFactory = Object.freeze({
  valido: (sobrescritas = {}) =>
    new ProdutoPojo({
      nome: `${PREFIXO_MASSA} ${faker.commerce.productName()} ${identificadorUnico()}`,
      preco: faker.number.int({ min: 10, max: 5000 }),
      descricao: faker.commerce.productDescription(),
      quantidade: faker.number.int({ min: 5, max: 100 }),
      ...sobrescritas,
    }),
});
