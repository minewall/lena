import { Card } from "../../components/ui";

export function ConfiguracoesGeral() {
  return (
    <Card>
      <h2 className="font-display text-xl text-cafe">Geral</h2>
      <p className="mt-2 text-cafe-soft">
        Aqui virão dados do negócio, time, fuso, billing. Por enquanto, todos
        os ajustes ficam em <em>Cérebro da Lena</em>.
      </p>
    </Card>
  );
}
