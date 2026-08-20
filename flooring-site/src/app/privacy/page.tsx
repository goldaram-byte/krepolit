import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика обработки персональных данных.",
};

// NOTE: This is a placeholder policy covering the minimum required to make
// the lead forms' consent checkbox legally meaningful (152-ФЗ). It must be
// reviewed and finalized by a lawyer before real personal data is collected.
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">
        Политика обработки персональных данных
      </h1>

      <div className="mt-6 space-y-4 text-stone-700">
        <p>
          Настоящая политика определяет порядок обработки персональных данных
          посетителей сайта в соответствии с Федеральным законом от 27.07.2006
          № 152-ФЗ «О персональных данных».
        </p>
        <p>
          Отправляя форму на сайте, вы предоставляете согласие на обработку указанных
          персональных данных (имя, телефон, email, сообщение) в целях обработки
          заявки, связи с вами и информирования о статусе заказа.
        </p>
        <p>
          Персональные данные не передаются третьим лицам, за исключением случаев,
          необходимых для исполнения заявки (например, службам доставки), и
          хранятся не дольше, чем это необходимо для целей обработки.
        </p>
        <p>
          Вы можете отозвать согласие на обработку персональных данных, направив
          запрос на контактный email, указанный на странице{" "}
          <a href="/contacts" className="underline hover:text-stone-900">
            «Контакты»
          </a>
          .
        </p>
      </div>
    </div>
  );
}
