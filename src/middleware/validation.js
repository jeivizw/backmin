// Validação específica de leitura
const validateLeitura = (req, res, next) => {
    const { minutos, data_registro } = req.body;
    
    if (!minutos || minutos <= 0) {
        return res.status(400).json({ 
            error: 'Minutos deve ser maior que zero' 
        });
    }
    
    if (minutos > 16) {
        return res.status(400).json({ 
            error: 'Limite máximo de 16 minutos por registro' 
        });
    }
    
    if (data_registro) {
        const data = new Date(data_registro);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (data > hoje) {
            return res.status(400).json({ 
                error: 'Não é possível registrar em datas futuras' 
            });
        }
    }
    
    next();
};

module.exports = { validateLeitura };