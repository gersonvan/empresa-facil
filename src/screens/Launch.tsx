import ScreenContainer from '../components/ScreenContainer'
import { Button, Card, Input } from '../components/ui'
import styles from './Placeholder.module.css'

export default function Launch() {
  return (
    <ScreenContainer title="Lançar">
      <Card className={styles.formCard}>
        <div className={styles.formGrid}>
          <Input label="Descrição" placeholder="Ex.: aluguel do escritório" helperText="Use um nome curto e direto." />
          <Input label="Valor" type="number" inputMode="decimal" placeholder="0,00" />
          <Button variant="primary" fullWidth>
            Salvar rascunho
          </Button>
        </div>
      </Card>
    </ScreenContainer>
  )
}
