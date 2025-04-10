import { useEffect, useRef, FC } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import DragDrop from "editorjs-drag-drop";
import { editorTools } from "./tools";
import { exampleData } from "./data";

export const DirectEditor: FC = () => {
  const ejInstance = useRef<EditorJS | null>(null);

  const initEditor = (): void => {
    const editor: EditorJS = new EditorJS({
      holder: "editorjs",
      autofocus: true,
      data: exampleData,
      i18n: {
        messages: {
          ui: {
            blockTunes: {
              toggler: {
                "Click to tune": "Clicca per personalizzare",
                "or drag to move": "oppure trascina per spostare",
              },
            },
            inlineToolbar: {
              converter: {
                "Convert to": "Converti in",
              },
            },
          },
          toolNames: {
            Text: "Testo",
            Header: "Titolo",
            List: "Lista",
            Image: "Immagine",
            Code: "Codice",
            Quote: "Citazione",
            Marker: "Evidenzia",
            CheckList: "Lista di controllo",
            Delimiter: "Separatore",
            InlineCode: "Codice inline",
            LinkTool: "Link",
            Table: "Tabella",
            Warning: "Avviso",
            Columns: "Colonne",
          },
          tools: {
            header: {
              placeholder: "Inserisci un titolo",
            },
            list: {
              placeholder: "Inserisci una lista",
            },
            image: {
              placeholder: "Inserisci l'URL dell'immagine",
            },
            code: {
              placeholder: "Inserisci il tuo codice",
            },
            quote: {
              placeholder: "Inserisci una citazione",
              captionPlaceholder: "Scrivi una didascalia",
            },
            marker: {
              shortcut: "CMD+SHIFT+M",
            },
            checklist: {
              placeholder: "Scrivi l'elemento della lista di controllo",
            },
            inlineCode: {
              placeholder: "Inserisci codice inline",
            },
            linkTool: {
              placeholder: "Inserisci un URL",
              captionPlaceholder: "Testo del link",
            },
            table: {
              placeholder: "Inserisci i dati tabellari",
            },
            warning: {
              titlePlaceholder: "Titolo dell'avviso",
              messagePlaceholder: "Messaggio dell'avviso",
            },
            columns: {
              "2 Columns": "Due colonne",
              "3 Columns": "Tre colonne",
              "Roll Columns": "Ruota colonne",
              "Are you sure?": "Sei sicuro?",
              "This will delete Column 3!": "Questo eliminerà la Colonna 3!",
              "Yes, delete it!": "Sì, elimina!",
              Cancel: "Annulla",
            },
          },
        },
      },
      onReady: () => {
        ejInstance.current = editor;
        new DragDrop(editor);
      },
      onChange: async (): Promise<void> => {
        try {
          const content: OutputData = await editor.save();
          console.log("onChange JSON:", content);
        } catch (error) {
          console.error("Errore nel salvataggio dei dati:", error);
        }
      },
      tools: editorTools,
    });
  };

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    return () => {
      if (ejInstance.current) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
  }, []);

  return <div className="flex flex-col px-16" id="editorjs" />;
};
