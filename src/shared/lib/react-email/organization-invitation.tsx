import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface Props {
  email: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
}

export const OrganizationInvitation = ({
  inviterName,
  inviterEmail,
  organizationName,
  inviteLink,
}: Props) => {
  return (
    <Html>
      <Head />
      <Preview>
        Invitación para unirse a la organización {organizationName}
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded-2xl border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Heading className="font-extrabold">Manglara</Heading>
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Te invitaron a unirte a {organizationName}
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">Hola,</Text>
            <Text className="text-[14px] leading-[24px] text-black">
              {inviterName} ({inviterEmail}) te ha invitado a unirte a la
              organización <b>{organizationName}</b> en Manglara.
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Para aceptar la invitación y unirte, haz clic en el botón de
              abajo.
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded-2xl bg-black px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Aceptar invitación
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              o copia y pega este enlace en tu navegador:{" "}
              <Link
                href={inviteLink}
                className="text-wrap break-all text-blue-600 no-underline"
              >
                {inviteLink}
              </Link>
            </Text>
            <Text className="mt-4 text-[12px] leading-[20px] text-gray-500">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OrganizationInvitation.PreviewProps = {
  email: "test@test.com",
  inviterName: "Test User",
  inviterEmail: "test@test.com",
  organizationName: "Test Organization",
  inviteLink:
    "https://manglara.aragundy.com/api/auth/magic-link/verify?token=sltkojopgtpxacfmbwevccbzcerugnfw&callbackURL=/home",
} as Props;

export default OrganizationInvitation;
