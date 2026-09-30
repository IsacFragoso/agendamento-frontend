import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import {
  createService,
  deleteService,
  listCategories,
  listProviderServices,
  updateService as patchService,
} from '../services/services.service';

const INITIAL_FORM = {
  titulo: '',
  descricao: '',
  preco: '',
  duracao_padrao: '60',
  id_categoria: '',
};

export function useProviderServices({ providerId, token }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!providerId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const [servicePayload, categoryPayload] = await Promise.all([
        listProviderServices(providerId),
        listCategories(),
      ]);

      setServices(Array.isArray(servicePayload) ? servicePayload : []);
      setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os serviços do prestador.'));
      setServices([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const submitService = async (event) => {
    event.preventDefault();
    const price = Number.parseFloat(formValues.preco);
    const duration = Number.parseInt(formValues.duracao_padrao, 10);
    const categoryId = Number.parseInt(formValues.id_categoria, 10);

    if (Number.isNaN(price)) {
      setErrorMessage('Informe um preço válido.');
      return false;
    }

    if (Number.isNaN(duration) || Number.isNaN(categoryId)) {
      setErrorMessage('Preencha duração e categoria corretamente.');
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const payload = {
        titulo: formValues.titulo,
        descricao: formValues.descricao,
        preco: price,
        duracao_padrao: duration,
        id_prestador: Number.parseInt(providerId, 10),
        id_categoria: categoryId,
      };
      const createdService = await createService(payload, token);

      setFormValues(INITIAL_FORM);
      setServices((current) => [...current, {
        ...payload,
        ...createdService,
        categoria: createdService.categoria || categories.find((category) => category.id_categoria === categoryId),
      }]);
      setFeedbackMessage('Serviço cadastrado com sucesso.');
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar o serviço.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeService = async (serviceId) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await deleteService(serviceId, token);
      setServices((current) => current.filter((service) => (service.id_servico || service.id) !== serviceId));
      setFeedbackMessage('Serviço removido com sucesso.');
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o serviço.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateServiceRecord = async (serviceId, payload) => {
    const previousService = services.find((service) => (service.id_servico || service.id) === serviceId);
    if (!previousService) {
      return { succeeded: false, errorMessage: 'Não foi possível encontrar esse serviço.' };
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');
    setServices((current) => current.map((service) => (
      (service.id_servico || service.id) === serviceId ? { ...service, ...payload } : service
    )));

    try {
      const updatedService = await patchService(serviceId, payload, token);
      setServices((current) => current.map((service) => (
        (service.id_servico || service.id) === serviceId ? { ...service, ...updatedService } : service
      )));
      setFeedbackMessage('Serviço atualizado com sucesso.');
      return { succeeded: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Não foi possível atualizar o serviço.');
      setServices((current) => current.map((service) => (
        (service.id_servico || service.id) === serviceId ? previousService : service
      )));
      setErrorMessage(message);
      return { succeeded: false, errorMessage: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    categories,
    errorMessage,
    feedbackMessage,
    formValues,
    isLoading,
    isSubmitting,
    services,
    loadData,
    removeService,
    submitService,
    updateServiceRecord,
    updateField,
  };
}
