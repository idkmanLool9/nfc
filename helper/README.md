# Desktop NFC helper (optioneel, alleen self-hosted)

Web NFC werkt alleen op Android Chrome. Op een desktop kun je een fysieke
NFC-reader (bv. ACR122U via PC/SC of een libnfc-compatible reader) gebruiken
en UIDs doorsturen naar de webapp.

> Werkt **alleen** als je deze app zelf host (Vercel, eigen server, …).
> Op GitHub Pages is er geen server, dus daar geen API endpoint.

## Endpoint

`POST /api/nfc/scan`

```json
{
  "uid": "04A21BC97E80",
  "source": "acr122u",
  "readerId": "desk-1"
}
```

De webapp valideert de UID en kan deze doorgeven aan de browser via een
front-end poll of een websocket bridge (uit te breiden).

## Voorbeeld helper (Node.js, pseudocode)

```js
import { NFC } from "nfc-pcsc";

const nfc = new NFC();
nfc.on("reader", (reader) => {
  reader.on("card", async (card) => {
    await fetch("http://localhost:3000/api/nfc/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uid: card.uid, source: "pcsc", readerId: reader.name }),
    });
  });
});
```

## Voorbeeld helper (Python, pyscard)

```python
from smartcard.System import readers
import requests

r = readers()[0]
conn = r.createConnection()
conn.connect()
data, sw1, sw2 = conn.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
uid = "".join(f"{b:02X}" for b in data)
requests.post("http://localhost:3000/api/nfc/scan", json={"uid": uid, "source": "pyscard"})
```
