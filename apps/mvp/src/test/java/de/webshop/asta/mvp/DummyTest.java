import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DummyTest {

    @Test
    void shouldAlwaysPassToGenerateXmlReport() {
        // Dieser Test macht nichts anderes, als "wahr" zu sein.
        // Er zwingt Maven dazu, den Ordner surefire-reports und die XML zu erstellen.
        assertTrue(true, "Dieser Test ist ein Platzhalter für die CI-Pipeline.");
    }
}