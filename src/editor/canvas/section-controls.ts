import type { Component, Editor, Plugin } from 'grapesjs';

const EMPTY_SECTION = `<mj-section background-color="#ffffff" padding-top="20px" padding-right="0px" padding-bottom="20px" padding-left="0px">
  <mj-column padding="0px"></mj-column>
</mj-section>`;

type Direction = 'above' | 'below';
type Action = 'add' | 'duplicate';

function getBodyComponent(editor: Editor): Component | null {
  const wrapper = editor.getWrapper();
  if (!wrapper) return null;
  const body = wrapper.find('mj-body')[0] ?? wrapper;
  return body as Component;
}

function appendSection(editor: Editor, section: Component | null, direction: Direction, action: Action) {
  const parent = section?.parent() ?? getBodyComponent(editor);
  if (!parent) return null;

  const content = action === 'duplicate' && section ? section.clone() : EMPTY_SECTION;
  const at = section ? section.index() + (direction === 'below' ? 1 : 0) : parent.components().length;
  const [inserted] = parent.append(content, { at });

  if (inserted) {
    editor.select(inserted);
    inserted.view?.render?.();
  }

  return inserted;
}

export const sectionControlsPlugin: Plugin = (editor) => {
  let activeSection: Component | null = null;
  let controls: HTMLElement[] = [];

  const removeControls = () => {
    controls.forEach((control) => control.remove());
    controls = [];
    activeSection?.getEl()?.classList.remove('builder-section-active');
  };

  const resolveSection = (component: Component | undefined): Component | null => {
    let current: Component | undefined = component;

    while (current) {
      if (current.is('mj-section')) return current;
      current = current.parent();
    }

    return null;
  };

  const makeButton = (
    section: Component,
    direction: Direction,
    action: Action,
  ) => {
    const doc = section.getEl()?.ownerDocument ?? document;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'builder-section-action';
    button.textContent = action === 'add' ? '+' : 'D';
    button.title = action === 'add'
      ? `Add section ${direction}`
      : `Duplicate section ${direction}`;
    button.setAttribute('aria-label', button.title);

    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      appendSection(editor, section, direction, action);
    });

    return button;
  };

  const makeControl = (
    section: Component,
    direction: Direction,
  ) => {
    const doc = section.getEl()?.ownerDocument ?? document;
    const control = doc.createElement('div');
    control.className = `builder-section-control builder-section-control-${direction === 'above' ? 'top' : 'bottom'}`;
    control.append(
      makeButton(section, direction, 'add'),
      makeButton(section, direction, 'duplicate'),
    );
    return control;
  };

  const renderSectionControls = () => {
    removeControls();
    if (!activeSection) return;

    const element = activeSection.getEl();
    if (!element) return;

    element.classList.add('builder-section-active');
    const topControl = makeControl(activeSection, 'above');
    const bottomControl = makeControl(activeSection, 'below');
    element.append(topControl, bottomControl);
    controls = [topControl, bottomControl];
  };

  const renderBodyAddButton = () => {
    const body = getBodyComponent(editor);
    if (!body) return;

    const element = body.getEl();
    if (!element) return;

    const existing = element.querySelector('.builder-body-add-section');
    if (existing) return;

    const doc = element.ownerDocument;
    const wrap = doc.createElement('div');
    wrap.className = 'builder-body-add-section';

    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'builder-body-add-section-button';
    button.textContent = '+ Add Section';
    button.title = 'Add a new section to the end of the email';
    button.setAttribute('aria-label', button.title);

    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      appendSection(editor, null, 'below', 'add');
    });

    wrap.appendChild(button);
    element.appendChild(wrap);
  };

  const syncSelection = () => {
    const selected = editor.getSelected();
    const nextSection = resolveSection(selected);

    if (nextSection !== activeSection) {
      removeControls();
      activeSection = nextSection;
    }

    renderSectionControls();
  };

  editor.on('component:selected component:deselected', syncSelection);
  editor.on('component:update component:add component:remove canvas:refresh', () => {
    renderSectionControls();
    renderBodyAddButton();
  });
  editor.on('load', () => {
    renderBodyAddButton();
  });
};
