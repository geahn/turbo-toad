/* Ponte entre a store do jogo e a camada de rede.
   No cliente, TODA ação da store é encaminhada ao host em vez de
   rodar localmente. O host aplica e retransmite o estado pra todos. */

export type ForwardFn = (name: string, args: unknown[]) => boolean;

export const netBridge: { forward: ForwardFn } = {
  // padrão: modo local/host — nada é encaminhado, roda normal.
  forward: () => false,
};
