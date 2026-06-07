import AIConfigurationPage from "@/templates/AIConfigurationPage";

export default function Configure({ params }: { params: { id: string } }) {
    return <AIConfigurationPage strategyId={params.id} />;
}
