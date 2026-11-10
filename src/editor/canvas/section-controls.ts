import type { Component, Plugin } from 'grapesjs';

const EMPTY_SECTION = `<mj-section padding="0px">
  <mj-column padding="0px"></mj-column>
</mj-section>`;

type Direction = 'above' | 'below';
type Action = 'add' | 'duplicate';

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

  const getInsertIndex = (section: Component, direction: Direction): number => (
    section.index() + (direction === 'below' ? 1 : 0)
  );

  const insertSection = (section: Component, direction: Direction, action: Action) => {
    const parent = section.parent();
    if (!parent) return;

    const content = action === 'duplicate'
      ? section.clone()
      : EMPTY_SECTION;
    const [inserted] = parent.append(content, {
      at: getInsertIndex(section, direction),
    });

    if (inserted) editor.select(inserted);
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
      insertSection(section, direction, action);
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

  const renderControls = () => {
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

  const syncSelection = () => {
    const selected = editor.getSelected();
    const nextSection = resolveSection(selected);

    if (nextSection !== activeSection) {
      removeControls();
      activeSection = nextSection;
    }

    renderControls();
  };

  editor.on('component:selected component:deselected', syncSelection);
  editor.on('component:update component:add component:remove canvas:refresh', renderControls);
};
