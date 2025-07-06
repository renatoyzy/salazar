import project_package from "../package.json" with { type: "json" };

export default {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`O Salazar ${project_package.version} está ligado e operando.`);
    }
};
